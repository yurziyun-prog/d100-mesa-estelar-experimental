// ============================================================
// PATCH: Sistema de Hidratação Automática para Objetos de Mapa
// Resolve: PV 0/0 e Dureza 0 em objetos vindos da Oficina 2
// ============================================================

(function() {
    'use strict';
    
    console.log('[PATCH] Iniciando sistema de hidratação de objetos...');
    
    function waitForGlobals() {
        if (typeof labEstado_ !== 'undefined' && typeof objetosMapaDB !== 'undefined') {
            console.log('[PATCH] Variáveis globais detectadas, aplicando correções...');
            applyPatches();
        } else {
            setTimeout(waitForGlobals, 100);
        }
    }
    
    function applyPatches() {
        function hidratarObjeto(obj) {
            if (!obj || !obj.modeloId) return obj;
            
            const modelo = objetosMapaDB.find(m => String(m.id) === String(obj.modeloId));
            
            if (!modelo) {
                console.warn('[PATCH] Modelo não encontrado:', obj.modeloId);
                return obj;
            }
            
            const result = { ...obj };
            
            result.pvMax = Number(modelo.pvMax || 0);
            result.pvAtual = Number(modelo.pvMax || 0);
            result.dureza = Number(modelo.dureza || 0);
            result.pesoKg = Number(modelo.pesoKg || 0);
            result.material = modelo.material || '';
            result.inflamabilidade = Number(modelo.inflamabilidade || 0);
            result.inflamavel = Boolean(modelo.inflamavel);
            result.destrutivel = Boolean(modelo.destrutivel);
            result.bloqueiaMovimento = Boolean(modelo.bloqueiaMovimento);
            result.bloqueiaVisao = Boolean(modelo.bloqueiaVisao);
            result.destruido = false;
            
            if (!result.imagem && modelo.imagem) {
                result.imagem = modelo.imagem;
            }
            
            console.log('[PATCH] Objeto hidratado:', {
                id: result.id,
                modeloId: result.modeloId,
                pvMax: result.pvMax,
                dureza: result.dureza
            });
            
            return result;
        }
        
        function hidratarArray(arr) {
            if (!Array.isArray(arr)) return arr;
            return arr.map(obj => {
                if (obj && obj.modeloId && (!obj.pvMax || obj.pvMax === 0)) {
                    return hidratarObjeto(obj);
                }
                return obj;
            });
        }
        
        if (labEstado_ && !labEstado_.__patched__) {
            let objetosLabInternal = labEstado_.objetosLab || [];
            
            const handler = {
                get(target, prop) {
                    if (prop === 'push') {
                        return function(...args) {
                            const hydrated = args.map(obj => {
                                if (obj && obj.modeloId && (!obj.pvMax || obj.pvMax === 0)) {
                                    return hidratarObjeto(obj);
                                }
                                return obj;
                            });
                            return Array.prototype.push.apply(objetosLabInternal, hydrated);
                        };
                    }
                    return Reflect.get(target, prop);
                },
                set(target, prop, value) {
                    if (!isNaN(prop) && value && value.modeloId && (!value.pvMax || value.pvMax === 0)) {
                        value = hidratarObjeto(value);
                    }
                    target[prop] = value;
                    return true;
                }
            };
            
            const proxiedArray = new Proxy(objetosLabInternal, handler);
            
            Object.defineProperty(labEstado_, 'objetosLab', {
                get() { return proxiedArray; },
                set(newVal) {
                    if (Array.isArray(newVal)) {
                        objetosLabInternal = hidratarArray(newVal);
                    } else {
                        objetosLabInternal = newVal;
                    }
                },
                configurable: true
            });
            
            labEstado_.__patched__ = true;
            console.log('[PATCH] Monitoramento de objetosLab instalado');
        }
        
        if (typeof labCarregarMapaBanco_ === 'function') {
            const originalFn = labCarregarMapaBanco_;
            labCarregarMapaBanco_ = async function(...args) {
                const result = await originalFn.apply(this, args);
                setTimeout(() => {
                    if (labEstado_.objetosLab && labEstado_.objetosLab.length > 0) {
                        labEstado_.objetosLab = hidratarArray([...labEstado_.objetosLab]);
                    }
                }, 200);
                return result;
            };
            console.log('[PATCH] labCarregarMapaBanco_ patcheado');
        }
        
        if (typeof gm2loadLibraryMap === 'function') {
            const originalFn = gm2loadLibraryMap;
            gm2loadLibraryMap = async function(...args) {
                const result = await originalFn.apply(this, args);
                setTimeout(() => {
                    if (labEstado_.objetosLab && labEstado_.objetosLab.length > 0) {
                        labEstado_.objetosLab = hidratarArray([...labEstado_.objetosLab]);
                    }
                }, 200);
                return result;
            };
            console.log('[PATCH] gm2loadLibraryMap patcheado');
        }
        
        if (typeof gm2toLegacy === 'function') {
            const originalFn = gm2toLegacy;
            gm2toLegacy = function(...args) {
                const result = originalFn.apply(this, args);
                if (result && result.objetosLab && Array.isArray(result.objetosLab)) {
                    result.objetosLab = hidratarArray(result.objetosLab);
                }
                return result;
            };
            console.log('[PATCH] gm2toLegacy patcheado');
        }
        
        if (typeof gm2legacyToState_ === 'function') {
            const originalFn = gm2legacyToState_;
            gm2legacyToState_ = function(...args) {
                const result = originalFn.apply(this, args);
                if (labEstado_.objetosLab && Array.isArray(labEstado_.objetosLab)) {
                    labEstado_.objetosLab = hidratarArray(labEstado_.objetosLab);
                }
                return result;
            };
            console.log('[PATCH] gm2legacyToState_ patcheado');
        }
        
        window.__hidratarObjeto = hidratarObjeto;
        window.__hidratarArray = hidratarArray;
        
        console.log('[PATCH] ✅ Todas as correções aplicadas com sucesso');
    }
    
    waitForGlobals();
})();
