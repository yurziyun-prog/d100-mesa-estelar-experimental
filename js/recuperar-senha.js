export const textosRecuperacao={
 pt:{label:'Esqueci minha senha',invalid:'Digite seu e-mail cadastrado no campo acima.',sending:'Enviando solicitação…',sent:'Se esse e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Confira também a pasta de spam. Depois, volte aqui para entrar.',network:'Não foi possível conectar. Confira sua internet e tente novamente.',limit:'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',error:'Não foi possível solicitar a recuperação agora. Tente novamente mais tarde.'},
 en:{label:'Forgot my password',invalid:'Enter your registered email in the field above.',sending:'Sending request…',sent:'If this email is registered, you will receive a link to set a new password. Check your spam folder too. Then return here to sign in.',network:'Could not connect. Check your connection and try again.',limit:'Too many attempts. Please wait a few minutes before trying again.',error:'Could not request a password reset. Please try again later.'},
 zh:{label:'忘记密码',invalid:'请在上方输入注册邮箱。',sending:'正在发送请求…',sent:'如果此邮箱已注册，您将收到重设密码的链接。请同时检查垃圾邮件文件夹，然后返回此处登录。',network:'连接失败，请检查网络后重试。',limit:'尝试次数过多，请等待几分钟后重试。',error:'暂时无法申请重设密码，请稍后重试。'}
};
export function criarRecuperacaoSenha({auth,send,root=document,language=()=> 'pt'}){
 let pending=false;
 return async()=>{
  if(pending)return;
  const lang=language(),t=textosRecuperacao[lang]||textosRecuperacao.pt,email=root.getElementById('loginEmail'),button=root.getElementById('resetPasswordButton'),message=root.getElementById('resetPasswordMessage');
  const show=(text,error=false)=>{message.textContent=text;message.className='message '+(error?'error':'success');};
  const address=email.value.trim();
  if(!address||!email.validity.valid){show(t.invalid,true);email.focus();return;}
  pending=true;button.disabled=true;message.setAttribute('aria-busy','true');show(t.sending);
  try{auth.languageCode=lang==='zh'?'zh-CN':lang;await send(auth,address);show(t.sent);}
  catch(e){show(e.code==='auth/user-not-found'?t.sent:e.code==='auth/invalid-email'?t.invalid:e.code==='auth/network-request-failed'?t.network:e.code==='auth/too-many-requests'?t.limit:t.error,e.code!=='auth/user-not-found');}
  finally{pending=false;button.disabled=false;message.setAttribute('aria-busy','false');}
 };
}
