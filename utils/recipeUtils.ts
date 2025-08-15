import { Recipe, Country } from '../types/Recipe';
import countriesIndex from '../data/index.json';

// Static imports for all country data files
import afghanistanData from '../data/afghanistan.json';
import algeriaData from '../data/algeria.json';
import argentinaData from '../data/argentina.json';
import australiaData from '../data/australia.json';
import austriaData from '../data/austria.json';
import bangladeshData from '../data/bangladesh.json';
import belgiumData from '../data/belgium.json';
import brazilData from '../data/brazil.json';
import canadaData from '../data/canada.json';
import chileData from '../data/chile.json';
import chinaData from '../data/china.json';
import colombiaData from '../data/colombia.json';
import cubaData from '../data/cuba.json';
import czechRepublicData from '../data/czech_republic.json';
import denmarkData from '../data/denmark.json';
import ecuadorData from '../data/ecuador.json';
import egyptData from '../data/egypt.json';
import ethiopiaData from '../data/ethiopia.json';
import finlandData from '../data/finland.json';
import franceData from '../data/france.json';
import germanyData from '../data/germany.json';
import greeceData from '../data/greece.json';
import hungaryData from '../data/hungary.json';
import indonesiaData from '../data/indonesia.json';
import indiaData from '../data/india.json';
import iranData from '../data/iran.json';
import israelData from '../data/israel.json';
import italyData from '../data/italy.json';
import jamaicaData from '../data/jamaica.json';
import japanData from '../data/japan.json';
import koreaData from '../data/korea.json';
import lebanonData from '../data/lebanon.json';
import malaysiaData from '../data/malaysia.json';
import mexicoData from '../data/mexico.json';
import moroccoData from '../data/morocco.json';
import myanmarData from '../data/myanmar.json';
import nepalData from '../data/nepal.json';
import netherlandsData from '../data/netherlands.json';
import nigeriaData from '../data/nigeria.json';
import norwayData from '../data/norway.json';
import peruData from '../data/peru.json';
import philippinesData from '../data/philippines.json';
import polandData from '../data/poland.json';
import portugalData from '../data/portugal.json';
import romaniaData from '../data/romania.json';
import russiaData from '../data/russia.json';
import saudiArabiaData from '../data/saudi_arabia.json';
import southAfricaData from '../data/south_africa.json';
import spainData from '../data/spain.json';
import sriLankaData from '../data/sri_lanka.json';
import swedenData from '../data/sweden.json';
import thailandData from '../data/thailand.json';
import turkeyData from '../data/turkey.json';
import ukraineData from '../data/ukraine.json';
import unitedKingdomData from '../data/united_kingdom.json';
import unitedStatesData from '../data/united_states.json';
import venezuelaData from '../data/venezuela.json';
import vietnamData from '../data/vietnam.json';

// Static mapping of country files
const countryDataMap: { [fileName: string]: Country } = {
  'afghanistan.json': afghanistanData as Country,
  'algeria.json': algeriaData as Country,
  'argentina.json': argentinaData as Country,
  'australia.json': australiaData as Country,
  'austria.json': austriaData as Country,
  'bangladesh.json': bangladeshData as Country,
  'belgium.json': belgiumData as Country,
  'brazil.json': brazilData as Country,
  'canada.json': canadaData as Country,
  'chile.json': chileData as Country,
  'china.json': chinaData as Country,
  'colombia.json': colombiaData as Country,
  'cuba.json': cubaData as Country,
  'czech_republic.json': czechRepublicData as Country,
  'denmark.json': denmarkData as Country,
  'ecuador.json': ecuadorData as Country,
  'egypt.json': egyptData as Country,
  'ethiopia.json': ethiopiaData as Country,
  'finland.json': finlandData as Country,
  'france.json': franceData as Country,
  'germany.json': germanyData as Country,
  'greece.json': greeceData as Country,
  'hungary.json': hungaryData as Country,
  'indonesia.json': indonesiaData as Country,
  'india.json': indiaData as Country,
  'iran.json': iranData as Country,
  'israel.json': israelData as Country,
  'italy.json': italyData as Country,
  'jamaica.json': jamaicaData as Country,
  'japan.json': japanData as Country,
  'korea.json': koreaData as Country,
  'lebanon.json': lebanonData as Country,
  'malaysia.json': malaysiaData as Country,
  'mexico.json': mexicoData as Country,
  'morocco.json': moroccoData as Country,
  'myanmar.json': myanmarData as Country,
  'nepal.json': nepalData as Country,
  'netherlands.json': netherlandsData as Country,
  'nigeria.json': nigeriaData as Country,
  'norway.json': norwayData as Country,
  'peru.json': peruData as Country,
  'philippines.json': philippinesData as Country,
  'poland.json': polandData as Country,
  'portugal.json': portugalData as Country,
  'romania.json': romaniaData as Country,
  'russia.json': russiaData as Country,
  'saudi_arabia.json': saudiArabiaData as Country,
  'south_africa.json': southAfricaData as Country,
  'spain.json': spainData as Country,
  'sri_lanka.json': sriLankaData as Country,
  'sweden.json': swedenData as Country,
  'thailand.json': thailandData as Country,
  'turkey.json': turkeyData as Country,
  'ukraine.json': ukraineData as Country,
  'united_kingdom.json': unitedKingdomData as Country,
  'united_states.json': unitedStatesData as Country,
  'venezuela.json': venezuelaData as Country,
  'vietnam.json': vietnamData as Country,
};

export const getRandomRecipes = (count: number = 3): Recipe[] => {
  const allRecipes: Recipe[] = [];
  countriesIndex.countries.forEach(countryInfo => {
    const countryData = getCountryData(countryInfo.file);
    if (countryData && countryData.recipes) {
      allRecipes.push(...countryData.recipes);
    }
  });
  const shuffled = [...allRecipes].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getRecipesByMealType = (mealType: 'breakfast' | 'lunch' | 'dinner'): Recipe[] => {
  const allRecipes = getRandomRecipes(1000); // Get all recipes
  return allRecipes.filter(recipe => recipe.mealType.includes(mealType));
};

export const getRandomRecipeByMealType = (mealType: 'breakfast' | 'lunch' | 'dinner'): Recipe | null => {
  const mealRecipes = getRecipesByMealType(mealType);
  if (mealRecipes.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * mealRecipes.length);
  return mealRecipes[randomIndex];
};

export const getDailyRecommendations = () => {
  return {
    breakfast: getRandomRecipeByMealType('breakfast'),
    lunch: getRandomRecipeByMealType('lunch'),
    dinner: getRandomRecipeByMealType('dinner'),
  };
};

export const getRecipeById = (id: string): Recipe | null => {
  const result = getRecipeByIdFromCountry(id);
  return result?.recipe || null;
};

export const searchRecipes = (query: string): Recipe[] => {
  const allRecipes = getRandomRecipes(1000); // Get all recipes
  const lowerQuery = query.toLowerCase();
  return allRecipes.filter(recipe => 
    recipe.name.toLowerCase().includes(lowerQuery) ||
    recipe.cuisine.toLowerCase().includes(lowerQuery) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getRecipesByCuisine = (cuisine: string): Recipe[] => {
  const allRecipes = getRandomRecipes(1000); // Get all recipes
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

export const getCountryData = (countryFileName: string): Country | null => {
  try {
    return countryDataMap[countryFileName] || null;
  } catch (error) {
    console.error(`Error loading country data for ${countryFileName}:`, error);
    return null;
  }
};

export const getRecipesByCountry = (countryName: string): Recipe[] => {
  try {
    const country = countriesIndex.countries.find(c => c.name === countryName);
    if (!country) return [];
    
    const countryData = getCountryData(country.file);
    return countryData?.recipes || [];
  } catch (error) {
    console.error(`Error getting recipes for ${countryName}:`, error);
    return [];
  }
};

export const getRecipeByIdFromCountry = (recipeId: string): { recipe: Recipe; country: string } | null => {
  try {
    // Check all countries for the recipe
    for (const countryInfo of countriesIndex.countries) {
      const countryData = getCountryData(countryInfo.file);
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