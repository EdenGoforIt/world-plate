import { Recipe, Country } from '../types/Recipe';
import countriesIndex from '../data/index.json';

// Lazy loading cache for country data
const countryDataCache: Map<string, Country> = new Map();

// Lazy load country data
const loadCountryData = async (fileName: string): Promise<Country | null> => {
  try {
    // Check cache first
    if (countryDataCache.has(fileName)) {
      return countryDataCache.get(fileName)!;
    }

    // Dynamic import based on filename
    let data: Country | null = null;
    const fileNameWithoutExt = fileName.replace('.json', '');
    
    switch (fileNameWithoutExt) {
      case 'afghanistan': data = (await import('../data/afghanistan.json')).default as Country; break;
      case 'algeria': data = (await import('../data/algeria.json')).default as Country; break;
      case 'argentina': data = (await import('../data/argentina.json')).default as Country; break;
      case 'australia': data = (await import('../data/australia.json')).default as Country; break;
      case 'austria': data = (await import('../data/austria.json')).default as Country; break;
      case 'bangladesh': data = (await import('../data/bangladesh.json')).default as Country; break;
      case 'belgium': data = (await import('../data/belgium.json')).default as Country; break;
      case 'brazil': data = (await import('../data/brazil.json')).default as Country; break;
      case 'canada': data = (await import('../data/canada.json')).default as Country; break;
      case 'chile': data = (await import('../data/chile.json')).default as Country; break;
      case 'china': data = (await import('../data/china.json')).default as Country; break;
      case 'colombia': data = (await import('../data/colombia.json')).default as Country; break;
      case 'cuba': data = (await import('../data/cuba.json')).default as Country; break;
      case 'czech_republic': data = (await import('../data/czech_republic.json')).default as Country; break;
      case 'denmark': data = (await import('../data/denmark.json')).default as Country; break;
      case 'ecuador': data = (await import('../data/ecuador.json')).default as Country; break;
      case 'egypt': data = (await import('../data/egypt.json')).default as Country; break;
      case 'ethiopia': data = (await import('../data/ethiopia.json')).default as Country; break;
      case 'finland': data = (await import('../data/finland.json')).default as Country; break;
      case 'france': data = (await import('../data/france.json')).default as Country; break;
      case 'germany': data = (await import('../data/germany.json')).default as Country; break;
      case 'greece': data = (await import('../data/greece.json')).default as Country; break;
      case 'hungary': data = (await import('../data/hungary.json')).default as Country; break;
      case 'indonesia': data = (await import('../data/indonesia.json')).default as Country; break;
      case 'india': data = (await import('../data/india.json')).default as Country; break;
      case 'iran': data = (await import('../data/iran.json')).default as Country; break;
      case 'israel': data = (await import('../data/israel.json')).default as Country; break;
      case 'italy': data = (await import('../data/italy.json')).default as Country; break;
      case 'jamaica': data = (await import('../data/jamaica.json')).default as Country; break;
      case 'japan': data = (await import('../data/japan.json')).default as Country; break;
      case 'korea': data = (await import('../data/korea.json')).default as Country; break;
      case 'lebanon': data = (await import('../data/lebanon.json')).default as Country; break;
      case 'malaysia': data = (await import('../data/malaysia.json')).default as Country; break;
      case 'mexico': data = (await import('../data/mexico.json')).default as Country; break;
      case 'morocco': data = (await import('../data/morocco.json')).default as Country; break;
      case 'myanmar': data = (await import('../data/myanmar.json')).default as Country; break;
      case 'nepal': data = (await import('../data/nepal.json')).default as Country; break;
      case 'netherlands': data = (await import('../data/netherlands.json')).default as Country; break;
      case 'nigeria': data = (await import('../data/nigeria.json')).default as Country; break;
      case 'norway': data = (await import('../data/norway.json')).default as Country; break;
      case 'peru': data = (await import('../data/peru.json')).default as Country; break;
      case 'philippines': data = (await import('../data/philippines.json')).default as Country; break;
      case 'poland': data = (await import('../data/poland.json')).default as Country; break;
      case 'portugal': data = (await import('../data/portugal.json')).default as Country; break;
      case 'romania': data = (await import('../data/romania.json')).default as Country; break;
      case 'russia': data = (await import('../data/russia.json')).default as Country; break;
      case 'saudi_arabia': data = (await import('../data/saudi_arabia.json')).default as Country; break;
      case 'south_africa': data = (await import('../data/south_africa.json')).default as Country; break;
      case 'spain': data = (await import('../data/spain.json')).default as Country; break;
      case 'sri_lanka': data = (await import('../data/sri_lanka.json')).default as Country; break;
      case 'sweden': data = (await import('../data/sweden.json')).default as Country; break;
      case 'thailand': data = (await import('../data/thailand.json')).default as Country; break;
      case 'turkey': data = (await import('../data/turkey.json')).default as Country; break;
      case 'ukraine': data = (await import('../data/ukraine.json')).default as Country; break;
      case 'united_kingdom': data = (await import('../data/united_kingdom.json')).default as Country; break;
      case 'united_states': data = (await import('../data/united_states.json')).default as Country; break;
      case 'venezuela': data = (await import('../data/venezuela.json')).default as Country; break;
      case 'vietnam': data = (await import('../data/vietnam.json')).default as Country; break;
      default: return null;
    }

    // Cache the loaded data
    if (data) {
      countryDataCache.set(fileName, data);
    }
    
    return data;
  } catch (error) {
    console.error(`Error loading country data for ${fileName}:`, error);
    return null;
  }
};

// Synchronous wrapper for backward compatibility
export const getCountryData = (countryFileName: string): Country | null => {
  // Check if already cached
  if (countryDataCache.has(countryFileName)) {
    return countryDataCache.get(countryFileName)!;
  }
  
  // For synchronous calls, return null if not cached
  // The data will be loaded on first async access
  return null;
};

// Async version for better performance
export const getCountryDataAsync = async (countryFileName: string): Promise<Country | null> => {
  return loadCountryData(countryFileName);
};

// Pre-load essential countries for better initial performance
export const preloadEssentialCountries = async () => {
  const essentialCountries = ['united_states.json', 'italy.json', 'japan.json', 'mexico.json', 'india.json'];
  await Promise.all(essentialCountries.map(file => loadCountryData(file)));
};

export const getRandomRecipes = async (count: number = 3): Promise<Recipe[]> => {
  const allRecipes: Recipe[] = [];
  
  // Load all countries in parallel for better performance
  const countryPromises = countriesIndex.countries.map(async (countryInfo) => {
    const countryData = await getCountryDataAsync(countryInfo.file);
    return countryData?.recipes || [];
  });
  
  const countryRecipes = await Promise.all(countryPromises);
  countryRecipes.forEach(recipes => allRecipes.push(...recipes));
  
  const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getRecipesByMealType = async (mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<Recipe[]> => {
  const allRecipes = await getRandomRecipes(1000); // Get all recipes
  return allRecipes.filter(recipe => recipe.mealType.includes(mealType));
};

export const getRandomRecipeByMealType = async (mealType: 'breakfast' | 'lunch' | 'dinner'): Promise<Recipe | null> => {
  const mealRecipes = await getRecipesByMealType(mealType);
  if (mealRecipes.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * mealRecipes.length);
  return mealRecipes[randomIndex];
};

export const getDailyRecommendations = async () => {
  const [breakfast, lunch, dinner] = await Promise.all([
    getRandomRecipeByMealType('breakfast'),
    getRandomRecipeByMealType('lunch'),
    getRandomRecipeByMealType('dinner')
  ]);
  
  return { breakfast, lunch, dinner };
};

export const getRecipeById = async (id: string): Promise<Recipe | null> => {
  const result = await getRecipeByIdFromCountry(id);
  return result?.recipe || null;
};

export const searchRecipes = async (query: string): Promise<Recipe[]> => {
  const allRecipes = await getRandomRecipes(1000); // Get all recipes
  const lowerQuery = query.toLowerCase();
  return allRecipes.filter(recipe => 
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.cuisine.toLowerCase().includes(lowerQuery) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getRecipesByCuisine = async (cuisine: string): Promise<Recipe[]> => {
  const allRecipes = await getRandomRecipes(1000); // Get all recipes
  return allRecipes.filter(recipe => recipe.cuisine.toLowerCase() === cuisine.toLowerCase());
};

export const formatCookTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

export const getDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy': return '#27AE60';
    case 'medium': return '#F39C12';
    case 'hard': return '#E74C3C';
    default: return '#95A5A6';
  }
};

// Country-based recipe functions
export const getCountries = () => {
  return countriesIndex.countries;
};

export const getRecipesByCountry = async (countryName: string): Promise<Recipe[]> => {
  try {
    const country = countriesIndex.countries.find(c => c.name === countryName);
    if (!country) return [];
    
    const countryData = await getCountryDataAsync(country.file);
    return countryData?.recipes || [];
  } catch (error) {
    console.error(`Error getting recipes for ${countryName}:`, error);
    return [];
  }
};

export const getRecipeByIdFromCountry = async (recipeId: string): Promise<{ recipe: Recipe; country: string } | null> => {
  try {
    // Check all countries for the recipe
    for (const countryInfo of countriesIndex.countries) {
      const countryData = await getCountryDataAsync(countryInfo.file);
      if (countryData) {
        const recipe = countryData.recipes.find(r => r.id === recipeId);
        if (recipe) {
          return { recipe, country: countryData.country };
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`Error finding recipe ${recipeId}:`, error);
    return null;
  }
};