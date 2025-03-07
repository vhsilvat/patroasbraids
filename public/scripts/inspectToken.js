/**
 * Ferramenta para inspecionar os tokens JWT do Supabase armazenados no navegador
 * 
 * Para usar:
 * 1. Abra o console do navegador (F12 ou Command+Option+I)
 * 2. Cole este código e pressione Enter
 */

(function inspectSupabaseToken() {
  console.log("🔍 Ferramenta de inspeção de tokens JWT do Supabase");
  
  // Procurar o token no localStorage
  let foundToken = false;
  
  // Procura em todos os itens do localStorage (formato padrão)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('sb-')) {
      try {
        const data = JSON.parse(localStorage.getItem(key));
        if (data && data.access_token) {
          console.log("✅ Token encontrado:", key);
          foundToken = true;
          
          // Decodificar o payload do token (segunda parte, separada por ponto)
          const tokenParts = data.access_token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            
            console.log("📝 Informações do token:");
            console.log("  ⏱️ Emitido em:", new Date(payload.iat * 1000).toLocaleString());
            console.log("  ⌛ Expira em:", new Date(payload.exp * 1000).toLocaleString());
            console.log("  👤 ID do usuário:", payload.sub);
            console.log("  🔑 Tipo de token:", payload.typ);
            
            // Verificar se o token está expirado
            const now = Math.floor(Date.now() / 1000);
            if (payload.exp < now) {
              console.error("❌ ALERTA: Este token está EXPIRADO!");
              console.log("   Tempo expirado há:", Math.floor((now - payload.exp) / 60), "minutos");
            } else {
              console.log("✅ Token válido por mais:", Math.floor((payload.exp - now) / 60), "minutos");
            }
            
            // Verificar os dados adicionais do usuário
            if (payload.user_metadata) {
              console.log("👤 Metadados do usuário:", payload.user_metadata);
            }
            
            if (payload.role) {
              console.log("🔑 Papel/função:", payload.role);
            }
            
            // Verificar claims personalizados
            const customClaims = {};
            for (const key in payload) {
              if (!['iat', 'exp', 'sub', 'aud', 'iss', 'typ', 'user_metadata', 'role'].includes(key)) {
                customClaims[key] = payload[key];
              }
            }
            
            if (Object.keys(customClaims).length > 0) {
              console.log("🏷️ Claims personalizados:", customClaims);
            }
          }
        }
      } catch (e) {
        console.error(`Erro ao processar chave ${key}:`, e);
      }
    }
  }
  
  if (!foundToken) {
    console.warn("⚠️ Nenhum token JWT do Supabase encontrado no localStorage.");
    console.log("   O usuário pode não estar autenticado ou o token pode estar armazenado de forma diferente.");
  }
  
  // Verificar cookies para sessão
  const cookies = document.cookie.split(';');
  let foundCookieSession = false;
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name && name.startsWith('sb-')) {
      console.log("🍪 Sessão em cookie encontrada:", name);
      foundCookieSession = true;
    }
  }
  
  if (!foundCookieSession) {
    console.log("🍪 Nenhum cookie de sessão Supabase encontrado.");
  }
  
  console.log("✅ Inspeção de token concluída!");
})();