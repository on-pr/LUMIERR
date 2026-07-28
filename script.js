/* =============================================
   CATÁLOGO SERENA — script.js
   ============================================= */

function trocarImagem(id, miniatura){
  document.getElementById(id).src = miniatura.src;
}

function trocarVideo(id, video){
  document.getElementById(id).outerHTML =
  `<video id="${id}" controls autoplay>
      <source src="${video}" type="video/mp4">
  </video>`;
}

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================
     CARRINHO — dados (persistem entre páginas)
     ========================================== */
  const CART_KEY = 'serena_cart';
  const WHATS_NUMERO = '5528999086387';

  function getCart(){
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch(e){
      return [];
    }
  }

  function saveCart(cart){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    atualizarBadge();
    renderCart();
  }

  function parsePreco(texto){
    // "R$9,90" -> 9.90
    const num = texto.replace(/[^\d,]/g, '').replace(',', '.');
    return parseFloat(num) || 0;
  }

  function formatarPreco(valor){
    return 'R$' + valor.toFixed(2).replace('.', ',');
  }

  function atualizarBadge(){
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const total = getCart().reduce((soma, item) => soma + item.qtd, 0);
    badge.textContent = total;
    badge.classList.remove('pulso');
    void badge.offsetWidth; // reinicia a animação
    badge.classList.add('pulso');
  }

  function adicionarAoCarrinho(nome, preco, imgSrc){
    const cart = getCart();
    const existente = cart.find(i => i.nome === nome);
    if (existente){
      existente.qtd += 1;
    } else {
      cart.push({ nome, preco, imgSrc, qtd: 1 });
    }
    saveCart(cart);
    abrirCarrinho();
  }

  function alterarQuantidade(index, delta){
    const cart = getCart();
    if (!cart[index]) return;
    cart[index].qtd += delta;
    if (cart[index].qtd <= 0){
      cart.splice(index, 1);
    }
    saveCart(cart);
  }

  function removerItem(index){
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
  }

  /* ==========================================
     CARRINHO — gaveta lateral (UI)
     ========================================== */
  const overlay = document.createElement('div');
  overlay.className = 'cart-overlay';
  overlay.id = 'cart-overlay';

  const drawer = document.createElement('div');
  drawer.className = 'cart-drawer';
  drawer.id = 'cart-drawer';
  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <h3>Meu Carrinho</h3>
      <button class="cart-close" id="cart-close" aria-label="Fechar carrinho">✕</button>
    </div>
    <div class="cart-drawer-body" id="cart-drawer-body"></div>
    <div class="cart-drawer-footer" id="cart-drawer-footer"></div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  function renderCart(){
    const cart = getCart();
    const body = document.getElementById('cart-drawer-body');
    const footer = document.getElementById('cart-drawer-footer');

    if (cart.length === 0){
      body.innerHTML = '<div class="cart-empty">Seu carrinho está vazio 🛍️</div>';
      footer.innerHTML = '';
      return;
    }

    body.innerHTML = cart.map((item, i) => `
      <div class="cart-item">
        <img src="${item.imgSrc}" alt="${item.nome}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.nome}</div>
          <div class="cart-item-price">${formatarPreco(item.preco)}</div>
          <div class="cart-item-qty">
            <button class="cart-qty-btn" data-action="menos" data-index="${i}">−</button>
            <span>${item.qtd}</span>
            <button class="cart-qty-btn" data-action="mais" data-index="${i}">+</button>
          </div>
          <button class="cart-item-remove" data-action="remover" data-index="${i}">remover</button>
        </div>
      </div>
    `).join('');

    const total = cart.reduce((soma, item) => soma + (item.preco * item.qtd), 0);
    const mensagem = encodeURIComponent(
      'Olá! Quero finalizar meu pedido:\n' +
      cart.map(i => `- ${i.qtd}x ${i.nome} (${formatarPreco(i.preco)})`).join('\n') +
      `\nTotal: ${formatarPreco(total)}`
    );

    footer.innerHTML = `
      <div class="cart-total-row"><span>Total</span><span>${formatarPreco(total)}</span></div>
      <a class="cart-checkout-btn" href="https://wa.me/${WHATS_NUMERO}?text=${mensagem}" target="_blank">Finalizar no WhatsApp</a>
    `;
  }

  drawer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const index = parseInt(btn.dataset.index, 10);
    if (btn.dataset.action === 'mais') alterarQuantidade(index, 1);
    if (btn.dataset.action === 'menos') alterarQuantidade(index, -1);
    if (btn.dataset.action === 'remover') removerItem(index);
  });

  function abrirCarrinho(){
    overlay.classList.add('ativo');
    drawer.classList.add('ativo');
    fecharBusca();
    fecharPerfil();
  }

  function fecharCarrinho(){
    overlay.classList.remove('ativo');
    drawer.classList.remove('ativo');
  }

  document.getElementById('cart-close').addEventListener('click', fecharCarrinho);
  overlay.addEventListener('click', fecharCarrinho);

  const btnCart = document.getElementById('btn-cart');
  if (btnCart){
    btnCart.addEventListener('click', () => {
      drawer.classList.contains('ativo') ? fecharCarrinho() : abrirCarrinho();
    });
  }

  /* ==========================================
     BOTÃO "ADICIONAR AO CARRINHO" EM CADA PRODUTO
     ========================================== */
  document.querySelectorAll('.prod-card').forEach(card => {
    const nomeEl = card.querySelector('.prod-name');
    const precoEl = card.querySelector('.prod-price');
    const imgEl = card.querySelector('.prod-img img');
    const infoEl = card.querySelector('.prod-info');
    const whatsBtn = card.querySelector('.btn-whats');

    if (!nomeEl || !precoEl || !imgEl || !infoEl) return;

    const nome = nomeEl.textContent.trim();
    const preco = parsePreco(precoEl.textContent);
    const imgSrc = imgEl.src;

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn-add';
    addBtn.textContent = '🛒 Adicionar ao Carrinho';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      adicionarAoCarrinho(nome, preco, imgSrc);
    });

    if (whatsBtn){
      whatsBtn.replaceWith(addBtn);
    } else {
      infoEl.appendChild(addBtn);
    }
  });

  atualizarBadge();
  renderCart();

  /* ==========================================
     BUSCA + FILTRO DE CATEGORIA + ORDENAÇÃO
     ========================================== */
  const headerMain = document.querySelector('.header-main');
  let searchBar = null;

  if (headerMain){
    searchBar = document.createElement('div');
    searchBar.className = 'search-bar';
    searchBar.id = 'search-bar';
    searchBar.innerHTML = `<input type="text" id="search-input" placeholder="Buscar produtos...">`;
    headerMain.insertAdjacentElement('afterend', searchBar);
  }

  function abrirBusca(){
    if (!searchBar) return;
    searchBar.classList.add('ativo');
    fecharCarrinho();
    fecharPerfil();
    setTimeout(() => document.getElementById('search-input').focus(), 150);
  }

  function fecharBusca(){
    if (!searchBar) return;
    searchBar.classList.remove('ativo');
  }

  const btnSearch = document.getElementById('btn-search');
  if (btnSearch){
    btnSearch.addEventListener('click', () => {
      searchBar.classList.contains('ativo') ? fecharBusca() : abrirBusca();
    });
  }

  const grid = document.querySelector('.prod-grid');
  let termoBusca = '';
  let categoriaAtiva = 'Todos';

  function aplicarFiltros(){
    const cards = document.querySelectorAll('.prod-card');
    let algumVisivel = false;

    cards.forEach(card => {
      const nome = (card.querySelector('.prod-name')?.textContent || '').toLowerCase();
      const categoria = card.dataset.categoria || '';
      const combinaBusca = termoBusca === '' || nome.includes(termoBusca);
      const combinaCategoria = categoriaAtiva === 'Todos' || categoria === categoriaAtiva;
      const mostrar = combinaBusca && combinaCategoria;
      card.classList.toggle('escondido', !mostrar);
      if (mostrar) algumVisivel = true;
    });

    let msg = document.getElementById('sem-resultados');
    if (!algumVisivel && grid){
      if (!msg){
        msg = document.createElement('div');
        msg.id = 'sem-resultados';
        msg.className = 'sem-resultados';
        grid.appendChild(msg);
      }
      if (termoBusca && categoriaAtiva !== 'Todos'){
        msg.textContent = `Nenhum produto encontrado em "${categoriaAtiva}" para a busca digitada`;
      } else if (termoBusca){
        msg.textContent = `Nenhum produto encontrado para a busca digitada`;
      } else {
        msg.textContent = `Nenhum produto encontrado em "${categoriaAtiva}"`;
      }
    } else if (msg){
      msg.remove();
    }
  }

  if (searchBar){
    const input = document.getElementById('search-input');
    input.addEventListener('input', () => {
      termoBusca = input.value.trim().toLowerCase();
      aplicarFiltros();
    });
  }

  /* FILTRO POR CATEGORIA (botões da filtros-bar) */
  const filtroBtns = document.querySelectorAll('.filtro-btn');
  if (filtroBtns.length){
    filtroBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filtroBtns.forEach(b => b.classList.remove('ativo'));
        btn.classList.add('ativo');
        categoriaAtiva = btn.textContent.trim();
        aplicarFiltros();
      });
    });
  }

  /* ORDENAÇÃO (select "Ordenar por") */
  const ordenarSelect = document.querySelector('.ordenar select');
  if (ordenarSelect && grid){
    const ordemOriginal = Array.from(grid.querySelectorAll('.prod-card'));

    ordenarSelect.addEventListener('change', () => {
      const valor = ordenarSelect.value;
      let ordenados = Array.from(grid.querySelectorAll('.prod-card'));

      if (valor === 'Menor Preço'){
        ordenados.sort((a, b) => precoDoCard(a) - precoDoCard(b));
      } else if (valor === 'Maior Preço'){
        ordenados.sort((a, b) => precoDoCard(b) - precoDoCard(a));
      } else if (valor === 'Novidades'){
        ordenados = ordemOriginal.slice().reverse();
      } else {
        ordenados = ordemOriginal.slice();
      }

      ordenados.forEach(card => grid.appendChild(card));
    });
  }

  function precoDoCard(card){
    return parsePreco(card.querySelector('.prod-price')?.textContent || '');
  }

  /* ==========================================
     PERFIL
     ========================================== */
  const btnProfile = document.getElementById('btn-profile');
  let profileDropdown = null;

  if (btnProfile){
    profileDropdown = document.createElement('div');
    profileDropdown.className = 'profile-dropdown';
    profileDropdown.id = 'profile-dropdown';
    profileDropdown.innerHTML = `
      <a href="#">Entrar</a>
      <a href="#">Criar Conta</a>
      <hr>
      <a href="#">Meus Pedidos</a>
    `;
    btnProfile.parentElement.appendChild(profileDropdown);

    btnProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.contains('ativo') ? fecharPerfil() : abrirPerfil();
    });
  }

  function abrirPerfil(){
    if (!profileDropdown) return;
    profileDropdown.classList.add('ativo');
    fecharBusca();
    fecharCarrinho();
  }

  function fecharPerfil(){
    if (!profileDropdown) return;
    profileDropdown.classList.remove('ativo');
  }

  document.addEventListener('click', (e) => {
    if (profileDropdown && !e.target.closest('#btn-profile') && !e.target.closest('#profile-dropdown')){
      fecharPerfil();
    }
  });

  // Expor globalmente caso precise chamar de outro lugar
  window.adicionarAoCarrinho = adicionarAoCarrinho;
});
