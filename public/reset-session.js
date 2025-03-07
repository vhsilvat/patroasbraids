/**
 * Script para limpar completamente os dados de autenticação do Supabase no navegador
 * 
 * Para usar este script, execute-o no console do navegador:
 * 1. Abra o DevTools (F12 ou Command+Option+I)
 * 2. Cole este código no console e pressione Enter
 */

(function() {
  // Identifique todos os itens do localStorage relacionados ao Supabase
  console.log("🧹 Iniciando limpeza da sessão do Supabase...");
  
  let supbaseItems = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-')) {
      supbaseItems.push(key);
    }
  }
  
  // Remova todos os itens do Supabase do localStorage
  console.log(`🔑 Encontrados ${supbaseItems.length} itens do Supabase no localStorage`);
  supbaseItems.forEach(key => {
    console.log(`   - Removendo: ${key}`);
    localStorage.removeItem(key);
  });
  
  // Limpe todos os cookies relacionados ao Supabase
  const cookies = document.cookie.split(';');
  let supabaseCookies = [];
  
  cookies.forEach(cookie => {
    const cookieName = cookie.trim().split('=')[0];
    if (cookieName.startsWith('sb-')) {
      supabaseCookies.push(cookieName);
    }
  });
  
  console.log(`🍪 Encontrados ${supabaseCookies.length} cookies do Supabase`);
  supabaseCookies.forEach(cookieName => {
    console.log(`   - Removendo cookie: ${cookieName}`);
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
  
  // Remova também a sessionStorage, por precaução
  let sessionItems = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith('sb-') || key === 'supabase.auth.token' || key === 'redirectUrl')) {
      sessionItems.push(key);
    }
  }
  
  console.log(`📝 Encontrados ${sessionItems.length} itens na sessionStorage`);
  sessionItems.forEach(key => {
    console.log(`   - Removendo: ${key}`);
    sessionStorage.removeItem(key);
  });
  
  console.log("✅ Limpeza concluída! A sessão do Supabase foi completamente removida.");
  console.log("🔄 Recarregue a página para iniciar uma nova sessão limpa.");
})();