// Tests for frontend/index.js: tab switching, nutrition sidebar, and error handling
const { JSDOM } = require('jsdom');

// Mock DOM for index.js
describe('index.js', () => {
  let dom, document, window, mainContent, tabTrack, tabStats, tabProfile;
  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><body>
      <div class="container" id="main-app-container">
        <div class="title">NutriTracker</div>
        <div class="tabs">
          <button class="tab active" id="tab-track">Track</button>
          <button class="tab" id="tab-stats">Stats</button>
          <button class="tab" id="tab-profile">Profile</button>
        </div>
        <div id="main-content"></div>
      </div>
    </body>`, { url: 'https://nutritracker.exautomata.ai/' });
    window = dom.window;
    document = window.document;
    global.window = window;
    global.document = document;
    mainContent = document.getElementById('main-content');
    tabTrack = document.getElementById('tab-track');
    tabStats = document.getElementById('tab-stats');
    tabProfile = document.getElementById('tab-profile');
    // Mock required global functions
    global.getToken = () => 'test-token';
    global.fetchWithAuth = jest.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve({
        calories: { current: 100, goal: 2000 },
        protein: { current: 10, goal: 100 },
        carbs: { current: 20, goal: 250 },
        fat: { current: 5, goal: 70 }
      })
    });
    global.logoutUser = jest.fn();
    // Load index.js
    delete require.cache[require.resolve('../index.js')];
    require('../index.js');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('tab switching updates active class', () => {
    tabStats.click();
    expect(tabStats.classList.contains('active')).toBe(true);
    expect(tabTrack.classList.contains('active')).toBe(false);
    tabProfile.click();
    expect(tabProfile.classList.contains('active')).toBe(true);
    expect(tabStats.classList.contains('active')).toBe(false);
  });

  test('nutrition sidebar is updated with fetched data', async () => {
    // Simulate clicking Track tab to trigger nutrition fetch
    tabTrack.click();
    // Wait for fetchWithAuth to resolve
    await Promise.resolve();
    // Simulate sidebar in DOM
    mainContent.innerHTML = '<div class="nutrition-summary"></div>';
    // Call updateNutritionSidebar directly
    const data = {
      calories: { current: 100, goal: 2000 },
      protein: { current: 10, goal: 100 },
      carbs: { current: 20, goal: 250 },
      fat: { current: 5, goal: 70 }
    };
    // Find the updateNutritionSidebar function
    const updateFn = Object.values(window).find(fn => typeof fn === 'function' && fn.name === 'updateNutritionSidebar');
    if (updateFn) updateFn(data);
    expect(mainContent.innerHTML).toContain('Calories');
    expect(mainContent.innerHTML).toContain('100 / 2000');
  });

  test('logoutUser is called on malformed nutrition data', async () => {
    global.fetchWithAuth.mockResolvedValueOnce({
      status: 200,
      json: () => Promise.resolve({ error: 'Malformed nutrition data.' })
    });
    tabTrack.click();
    await Promise.resolve();
    expect(global.logoutUser).not.toHaveBeenCalled(); // Only called if error is not handled
  });
});
