const cartCount = document.querySelector('#cart-count');
const cart = new Set();

function updateCart(id, button) {
  if (cart.has(id)) {
    cart.delete(id);
    button.textContent = 'Order now';
  } else {
    cart.add(id);
    button.textContent = 'Added';
  }
  cartCount.textContent = cart.size;
}

document.querySelectorAll('[data-order]').forEach(button => {
  button.addEventListener('click', () => updateCart(button.dataset.order, button));
});

document.querySelectorAll('[data-filter]').forEach(filter => {
  filter.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.remove('active'));
    filter.classList.add('active');
    const selected = filter.dataset.filter;
    document.querySelectorAll('.dress-card').forEach(card => {
      card.hidden = selected !== 'all' && card.dataset.category !== selected;
    });
  });
});
