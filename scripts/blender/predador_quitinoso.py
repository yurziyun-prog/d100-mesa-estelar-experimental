"""Conceito aprovado pelo Yuri, v215. Fonte editável e animações de artrópode.
blender -b -t 4 -P scripts/blender/predador_quitinoso.py -- arte-fonte/predador-quitinoso [--previa]
Não modifica as outras receitas. Render transparente, sem base nem aura.
"""
import os, sys, math, json
import bpy
from mathutils import Vector, Matrix
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bl_lib import limpa, material, esfera, seg, tubo, luz_e_camera, posiciona_camera

args = sys.argv[sys.argv.index('--') + 1:]
out = os.path.abspath(args[0]); os.makedirs(out, exist_ok=True)
preview = '--previa' in args
cinzas = '--cinzas' in args
limpa()
shell = material('Quitina carvão', (.018, .017, .014), .4, 1, 9, (.065, .052, .035))
rim = material('Bordas ocre envelhecido', (.15, .073, .025), .52)
horn = material('Pontas de queratina', (.12, .075, .032), .54)
joint = material('Membrana flexível', (.035, .026, .021), .8, 1, 25, (.075, .054, .035))
eye = material('Sensores âmbar sem emissão', (.5, .19, .018), .28)
if cinzas:
    # Espécie pequena e achatada, cinza de basalto, com bordas cor de brasa.
    shell.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.66
    for ramp in [n for n in shell.node_tree.nodes if n.type=='VALTORGB']:
        ramp.color_ramp.elements[0].color=(.021,.026,.03,1)
        ramp.color_ramp.elements[1].color=(.11,.12,.13,1)
    rim.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.19,.047,.012,1)
    horn.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.1,.11,.115,1)
for mat in (shell, rim, joint):
    nt = mat.node_tree; n = nt.nodes.new('ShaderNodeTexNoise'); n.inputs['Scale'].default_value = 52
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .22; bump.inputs['Distance'].default_value = .014
    nt.links.new(n.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], nt.nodes['Principled BSDF'].inputs['Normal'])

parts = []; rests = {}; legs = []
def attach(obj, bone):
    parts.append((obj, bone)); return obj
def ball(name, p, size, mat, bone):
    return attach(esfera(name, p, size, mat, seg=16), bone)
def branch(name, points, radii, mat, bone):
    return attach(tubo(name, points, radii, mat, resolucao=3, seg=8), bone)
def plate(name, y, z, length, width, height, bone):
    # Couraça en forme de coque: crête centrale, flancs anguleux et bord postérieur pointu.
    verts=[]; faces=[]; N=12
    for j, (f,w,h) in enumerate([(0,.04,.05),(.15,.72,.63),(.4,1,1),(.7,.91,.84),(1,.06,.08)]):
        for k in range(N):
            a=2*math.pi*k/N
            x=width*w*math.cos(a)
            zz=z+height*h*math.sin(a)
            yy=y+length*(.5-f)-(.13*length*abs(math.cos(a)) if j==3 else 0)
            verts.append((x,yy,zz))
    for j in range(4):
        for k in range(N): faces.append((j*N+k,j*N+(k+1)%N,(j+1)*N+(k+1)%N,(j+1)*N+k))
    faces.extend([tuple(reversed(range(N))),tuple(4*N+k for k in range(N))])
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
    me.materials.append(shell);me.materials.append(rim)
    for poly in me.polygons:
        poly.material_index=1 if poly.index//N==3 and poly.index%N in (0,5,6,11) else 0
        poly.use_smooth=True
    bevel=ob.modifiers.new('Arestas orgânicas','BEVEL');bevel.width=.025;bevel.segments=2
    attach(ob,bone)
    for side in (-1,1):
        branch('Lábio gasto da couraça',[(side*width*.55,y+length*.3,z+height*.5),(side*width*.97,y,z+height*.24),(side*width*.86,y-length*.3,z+height*.12),(side*width*.12,y-length*.51,z)],[.008,.012,.014,.003],rim,bone)
    return ob

rests['corpo']=((0,0,.45),(0,0,1.05))
ball('Tórax sob a armadura',(0,.16,.68),(.42,.63,.27),joint,'corpo')
plate('Escudo escapular',.34,.83,1.05,.52,.31,'corpo')
plate('Escudo dorsal',-.17,.78,.78,.49,.27,'corpo')
for i in range(7):
    y=-.47-i*.17; w=.39*(1-i/8.2)
    plate('Abdômen segmentado %02d'%i,y,.66-i*.035,.42,w,.16*(1-i/10),'corpo')
    for side in (-1,1):
        branch('Espora abdominal',[(side*w*.68,y-.03,.72-i*.035),(side*w*1.12,y-.17,.72-i*.035),(side*w*1.24,y-.29,.67-i*.035)],[.06,.035,.002],rim,'corpo')
for side in (-1,1):
    for y in (.57,.18,-.2):
        branch('Crista torácica',[(side*.32,y,.94),(side*.51,y-.12,1.04),(side*.65,y-.29,.98)],[.1,.065,.002],shell,'corpo')
    branch('Quilha do ombro',[(side*.23,.42,1.01),(side*.3,.13,1.17),(side*.27,-.13,1.12)],[.08,.065,.002],horn,'corpo')
rests['cabeca']=((0,.64,.68),(0,1.05,.68))
ball('Pescoço membranoso',(0,.68,.69),(.23,.27,.17),joint,'cabeca')
plate('Crânio em cunha',.93,.72,.75,.29,.17,'cabeca')
branch('Quilha craniana',[(0,.7,.87),(0,1.02,.93),(0,1.31,.73)],[.11,.065,.004],shell,'cabeca')
for side in (-1,1):
    for i in range(3): ball('Sensor âmbar',(side*(.235-i*.025),.87+i*.09,.79),(.032,.045,.025),eye,'cabeca')
    bone='mandibula_'+str(side); rests[bone]=((side*.17,1.08,.62),(side*.27,1.43,.61))
    branch('Mandíbula falciforme',[(side*.17,1.08,.62),(side*.32,1.29,.59),(side*.27,1.57,.58),(side*.07,1.65,.64)],[.1,.072,.032,.002],horn,bone)
    for i in range(3):
        branch('Dente da mandíbula',[(side*.29,1.26+i*.09,.61),(side*.16,1.32+i*.08,.62)],[.033,.001],shell,bone)

def foot_knee(hip,foot,bend):
    # IK analítico de dois segmentos; o pé de apoio não faz círculos no chão.
    hip=Vector(hip);foot=Vector(foot);d=foot-hip;dist=d.length;u=d.normalized()
    a=.78;b=.87
    t=(a*a-b*b+dist*dist)/(2*dist)
    v=Vector(bend);v=(v-u*v.dot(u)).normalized()
    return hip+u*t+v*math.sqrt(max(.001,a*a-t*t))

def limb_shell(name,p,q,r,bone):
    p=Vector(p);q=Vector(q);u=(q-p).normalized();a=u.cross(Vector((0,0,1))).normalized();b=a.cross(u).normalized()
    vs=[];fs=[];N=8
    for t,k in [(0,.55),(.16,1.1),(.52,.8),(.87,.42),(1,.25)]:
        for j in range(N):
            angle=j*math.tau/N;vs.append(tuple(p+(q-p)*t+a*(math.cos(angle)*r*k)+b*(math.sin(angle)*r*k*1.15)))
    for i in range(4):
        for j in range(N):fs.append((i*N+j,i*N+(j+1)%N,(i+1)*N+(j+1)%N,(i+1)*N+j))
    fs.extend([tuple(reversed(range(N))),tuple(4*N+j for j in range(N))])
    me=bpy.data.meshes.new(name);me.from_pydata(vs,[],fs);me.materials.append(shell)
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
    bevel=ob.modifiers.new('Borda gasta','BEVEL');bevel.width=.018;bevel.segments=2
    attach(ob,bone)

for side in (-1,1):
    for i,(hy,fy,fx) in enumerate([(.48,1.14,1.16),(.03,-.08,1.4),(-.35,-1.03,1.15)]):
        hip=Vector((side*.36,hy,.67));foot=Vector((side*fx,fy,.065));bend=(side*.3,-.6 if i==0 else .45,.55)
        knee=foot_knee(hip,foot,bend);tip=foot+Vector((-side*.07,.22,.01))
        names=['coxa_%s_%d'%(side,i),'tibia_%s_%d'%(side,i),'tarso_%s_%d'%(side,i)]
        for name,p,q in zip(names,[hip,knee,foot],[knee,foot,tip]): rests[name]=(tuple(p),tuple(q))
        ball('Junta da coxa',hip,(.14,.14,.14),joint,names[0])
        limb_shell('Fêmur blindado',hip,knee,.18 if i==0 else .135,names[0])
        ball('Joelho articulado',knee,(.1,.1,.1),joint,names[1])
        limb_shell('Tíbia afilada',knee,foot,.145 if i==0 else .105,names[1])
        v=foot-knee
        for j in range(3):
            p=knee+v*(.2+j*.2)
            branch('Serrilha da perna',[tuple(p),tuple(p+Vector((side*.11,-.05,.04))),tuple(p+Vector((side*.17,-.13,.015)))],[.045,.025,.001],rim,names[1])
        branch('Garra de apoio',[tuple(foot),tuple(foot+Vector((0,.1,-.02))),tuple(tip)],[.047,.03,.001],horn,names[2])
        legs.append(dict(side=side,i=i,hip=hip,foot=foot,bend=bend,names=names))

if cinzas:
    for side in (-1,1):
        branch('Palpo sensorial',[(side*.22,1.14,.75),(side*.42,1.48,.79),(side*.53,1.87,.72)],[.025,.018,.002],horn,'cabeca')
        branch('Forquilha caudal',[(side*.06,-1.41,.45),(side*.23,-1.74,.48),(side*.27,-2.02,.52)],[.07,.034,.002],shell,'corpo')
    # Escamas lascadas em vez de chifres altos no dorso.
    for ob,_ in parts:
        if ob.name.startswith(('Quilha do ombro','Crista torácica')):
            for v in ob.data.vertices: v.co.z=.76+(v.co.z-.76)*.3

# Um esqueleto real, com placas rígidas e juntas separadas; as ações ficam no .blend.
arm=bpy.data.armatures.new('Esqueleto do Predador');rig=bpy.data.objects.new('Predador Quitinoso · rig',arm);bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig;rig.select_set(True);bpy.ops.object.mode_set(mode='EDIT')
for name,(p,q) in rests.items():
    bone=arm.edit_bones.new(name);bone.head=p;bone.tail=q
bpy.ops.object.mode_set(mode='OBJECT')
for obj,bone in parts:
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
    bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
    group=obj.vertex_groups.new(name=bone);group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    mod=obj.modifiers.new('Esqueleto','ARMATURE');mod.object=rig
    obj.parent=rig
if cinzas: rig.scale=(.78,1.08,.58)
for bone in rig.pose.bones: bone.rotation_mode='QUATERNION'

def pose(action,t):
    tau=math.tau*t; pulse=math.sin(math.pi*t)
    breath=.008*math.sin(tau)
    dy=0; dz=breath; roll=0; recoil=0; gape=.03+.025*math.sin(tau)
    if action=='andar': dz=.012*math.cos(tau*2)
    if action=='atacar':
        # Antecipação, avanço curto, fechamento das mandíbulas e recuperação.
        dy=-.09*math.sin(math.pi*min(1,t/.35)) if t<.35 else .24*math.sin(math.pi*(t-.35)/.65)
        gape=.65*math.sin(math.pi*min(1,t/.55)) if t<.55 else .02
        dz=.025*pulse
    if action=='golpe': dy=-.12*pulse;roll=.12*pulse;gape=.18*pulse
    dead=0
    if action=='morrer': dead=t*t*(3-2*t);dz=-.32*dead;roll=.52*dead;gape=.4*dead
    M=Matrix.Translation((0,dy,dz))@Matrix.Rotation(roll,4,'Y')
    positions={k:(M@Vector(p),M@Vector(q)) for k,(p,q) in rests.items()}
    for side in (-1,1):
        key='mandibula_'+str(side);p,q=rests[key];p=Vector(p);q=Vector(q)
        turn=Matrix.Rotation(-side*gape,4,'Z');positions[key]=(M@p,M@(p+turn.to_3x3()@(q-p)))
    for leg in legs:
        hip=leg['hip'].copy();foot=leg['foot'].copy();i=leg['i'];side=leg['side']
        if action=='andar':
            ph=(t+(.5 if (i+(side==1))%2 else 0))%1
            if ph<.65: foot.y+=.32*(.5-ph/.65)
            else:
                swing=(ph-.65)/.35;foot.y+=.32*(-.5+swing);foot.z+=.19*math.sin(math.pi*swing)
        if action=='atacar' and i==0:
            foot.y+=.26*pulse;foot.z+=.18*pulse
        if dead:
            foot.x*=1-.34*dead;foot.y=hip.y+(foot.y-hip.y)*(1-.5*dead);foot.z+=.18*dead
        knee=foot_knee(hip,foot,leg['bend']);tip=foot+Vector((-side*.07,.22,.01))
        for name,p,q in zip(leg['names'],[hip,knee,foot],[knee,foot,tip]):positions[name]=(M@p,M@q)
    for name,(p,q) in positions.items():
        b=rig.pose.bones[name];length=(Vector(rests[name][1])-Vector(rests[name][0])).length
        b.matrix=Matrix.Translation(p)@(q-p).to_track_quat('Y','Z').to_matrix().to_4x4()@Matrix.Diagonal((1,(q-p).length/length,1,1))
    bpy.context.view_layer.update()

sc=bpy.context.scene;sc.render.resolution_percentage=100
cam=luz_e_camera(256,82,4.3);cam.data.ortho_scale=5.4 if cinzas else 4.3
sc.render.image_settings.color_mode='RGBA'
try: sc.eevee.taa_render_samples=32
except Exception: pass
sc.render.film_transparent=True
sc.render.threads_mode='FIXED';sc.render.threads=4
sc.view_settings.view_transform='AgX'
plan=[('parado',12,2.2),('andar',16,.95),('atacar',14,.9),('golpe',8,.55),('morrer',14,1.15)]
metadata=dict(id='rastejante_de_cinzas' if cinzas else 'insetoide_predador_1',quadro=256,ortho=5.4 if cinzas else 4.3,folhas={})
pose('parado',0)
deps=bpy.context.evaluated_depsgraph_get()
points=[o.evaluated_get(deps).matrix_world@Vector(v) for o,_ in parts for v in o.evaluated_get(deps).bound_box]
metadata['comp']=max(p.x for p in points)-min(p.x for p in points)
metadata['larg']=max(p.y for p in points)-min(p.y for p in points)
metadata['altura']=max(p.z for p in points)-min(p.z for p in points)
if preview:
    pose('parado',0);posiciona_camera(cam,'lado',elev=82,centro=(0,0,.6))
    sc.render.resolution_x=sc.render.resolution_y=768
    sc.render.filepath=os.path.join(out,'previa-cima.png');bpy.ops.render.render(write_still=True)
    cam.data.ortho_scale=4.5;posiciona_camera(cam,'frente',elev=28,centro=(0,0,.65))
    cam.location.x=-3;cam.rotation_euler=(Vector((0,0,.65))-cam.location).to_track_quat('-Z','Y').to_euler()
    sc.render.filepath=os.path.join(out,'previa-perspectiva.png');bpy.ops.render.render(write_still=True)
else:
    for action,n,duration in plan:
        rig.animation_data_clear()
        for i in range(n):
            t=i/n if action in ('andar','parado') else i/(n-1)
            sc.frame_set(i+1);pose(action,t)
            for b in rig.pose.bones:
                b.keyframe_insert('location',frame=i+1,group=b.name);b.keyframe_insert('rotation_quaternion',frame=i+1,group=b.name);b.keyframe_insert('scale',frame=i+1,group=b.name)
            posiciona_camera(cam,'lado',elev=82,centro=(0,0,.6))
            folder=os.path.join(out,action+'_lado');os.makedirs(folder,exist_ok=True)
            sc.render.filepath=os.path.join(folder,'q_%02d.png'%i);bpy.ops.render.render(write_still=True)
        clip=rig.animation_data.action;clip.name=('Cinzas_' if cinzas else 'Predador_')+action
        track=rig.animation_data.nla_tracks.new();track.name=action
        strip=track.strips.new(action,1,clip);track.mute=True;clip.use_fake_user=True
        metadata['folhas'][action+'_lado']=dict(quadros=n,dur=duration)
    rig.animation_data.action=None;pose('parado',0)
    sc.frame_start=1;sc.frame_end=16
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out,'rastejante-cinzas.blend' if cinzas else 'predador-quitinoso.blend'))
    json.dump(metadata,open(os.path.join(out,'meta.json'),'w'),indent=2)
print('PREDADOR CONCLUÍDO',flush=True)
