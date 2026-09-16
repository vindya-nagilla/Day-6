const API_URL = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';
const recipeGrid = document.querySelector('#recipe-grid');
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const resultsTitle = document.querySelector('#results-title');
const resultNote = document.querySelector('#result-note');
const emptyState = document.querySelector('#empty-state');
const savedCount = document.querySelector('#saved-count');
const savedRecipes = new Set(JSON.parse(localStorage.getItem('crave-saved') || '[]'));

function showLoading() {
  emptyState.classList.add('hidden');
  recipeGrid.innerHTML = Array.from({ length: 4 }, () => '<div class="loading-card" aria-label="Loading recipe"></div>').join('');
}

function escapeHtml(value = '') {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function recipeCard(recipe) {
  const youtube = recipe.strYoutube ? `<a class="youtube-link" href="${recipe.strYoutube}" target="_blank" rel="noreferrer" aria-label="Watch ${escapeHtml(recipe.strMeal)} on YouTube"><span class="play-icon"></span> Watch video</a>` : '';
  const isSaved = savedRecipes.has(recipe.idMeal);
  return `<article class="recipe-card">
    <div class="recipe-image-wrap">
      <img class="recipe-image" src="${recipe.strMealThumb}" alt="${escapeHtml(recipe.strMeal)}" loading="lazy">
      ${youtube}
    </div>
    <div class="recipe-content">
      <div class="recipe-meta"><span>${escapeHtml(recipe.strCategory || 'Recipe')}</span><span>•</span><span>${escapeHtml(recipe.strArea || 'Global')}</span></div>
      <h3 title="${escapeHtml(recipe.strMeal)}">${escapeHtml(recipe.strMeal)}</h3>
      <div class="card-bottom"><span>From TheMealDB</span><button class="save-recipe ${isSaved ? 'saved' : ''}" type="button" data-save="${recipe.idMeal}" aria-label="${isSaved ? 'Remove' : 'Save'} ${escapeHtml(recipe.strMeal)}"></button></div>
    </div>
  </article>`;
}

async function searchRecipes(query = 'chicken') {
  const cleanQuery = query.trim() || 'chicken';
  showLoading();
  resultsTitle.textContent = cleanQuery === 'chicken' ? 'A little inspiration' : `Recipes with ${cleanQuery}`;
  resultNote.textContent = 'Searching the kitchen...';
  try {
    const response = await fetch(`${API_URL}${encodeURIComponent(cleanQuery)}`);
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();
    const recipes = data.meals || [];
    recipeGrid.innerHTML = recipes.slice(0, 8).map(recipeCard).join('');
    emptyState.classList.toggle('hidden', recipes.length > 0);
    resultNote.textContent = recipes.length ? `${recipes.length} delicious idea${recipes.length === 1 ? '' : 's'} found` : 'Try searching for a different ingredient';
    bindSaveButtons();
  } catch (error) {
    recipeGrid.innerHTML = '';
    emptyState.textContent = 'The kitchen is taking a quick break. Check your connection and try again.';
    emptyState.classList.remove('hidden');
    resultNote.textContent = 'Could not load recipes';
  }
}

async function loadInspiration() {
  showLoading();
  resultsTitle.textContent = 'A little inspiration';
  resultNote.textContent = 'Mixing up the menu...';
  try {
    const categories = ['Chicken', 'Pasta', 'Beef', 'Vegetarian', 'Seafood', 'Cake', 'Milkshake', 'Chocolate Milkshake', 'Strawberry Milkshake', 'Soup'];
    const responses = await Promise.all(categories.map(category => fetch(`${API_URL}${category}`)));
    if (responses.some(response => !response.ok)) throw new Error('Request failed');
    const results = await Promise.all(responses.map(response => response.json()));
    const categoryRecipes = results.map(result => result.meals || []);
    const recipes = Array.from({ length: 2 }, (_, round) => categoryRecipes.map(meals => meals[round]).filter(Boolean)).flat().filter((recipe, index, allRecipes) => allRecipes.findIndex(item => item.idMeal === recipe.idMeal) === index);
    recipeGrid.innerHTML = recipes.slice(0, 12).map(recipeCard).join('');
    emptyState.classList.toggle('hidden', recipes.length > 0);
    resultNote.textContent = `${recipes.length} delicious ideas from every corner`;
    bindSaveButtons();
  } catch (error) {
    recipeGrid.innerHTML = '';
    emptyState.textContent = 'The kitchen is taking a quick break. Check your connection and try again.';
    emptyState.classList.remove('hidden');
    resultNote.textContent = 'Could not load recipes';
  }
}

function bindSaveButtons() {
  document.querySelectorAll('[data-save]').forEach(button => {
    button.addEventListener('click', () => {
      const id = button.dataset.save;
      if (savedRecipes.has(id)) savedRecipes.delete(id); else savedRecipes.add(id);
      localStorage.setItem('crave-saved', JSON.stringify([...savedRecipes]));
      button.classList.toggle('saved', savedRecipes.has(id));
      button.setAttribute('aria-label', `${savedRecipes.has(id) ? 'Remove' : 'Save'} recipe`);
      savedCount.textContent = savedRecipes.size;
    });
  });
}

searchForm.addEventListener('submit', event => {
  event.preventDefault();
  searchRecipes(searchInput.value);
});

document.querySelectorAll('[data-query]').forEach(button => {
  button.addEventListener('click', () => {
    searchInput.value = button.dataset.query;
    document.querySelectorAll('.category-tab').forEach(tab => tab.classList.toggle('active', tab === button));
    searchRecipes(button.dataset.query);
    document.querySelector('#seasonal').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

savedCount.textContent = savedRecipes.size;
loadInspiration();
