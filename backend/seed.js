const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Food = require('./models/Food');

const commonFoods = [
  { name: 'Chicken Breast', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, sugar: 0, sodium: 74 }, category: 'protein' },
  { name: 'Brown Rice', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 216, protein: 4.5, carbs: 45, fat: 1.8, fiber: 3.5, sugar: 0.7, sodium: 1 }, category: 'grain' },
  { name: 'Broccoli', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33 }, category: 'vegetable' },
  { name: 'Banana', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6, sugar: 12, sodium: 1 }, category: 'fruit' },
  { name: 'Whole Eggs', brand: '', servingSize: 50, servingUnit: 'g', nutrients: { calories: 78, protein: 6, carbs: 0.6, fat: 5, fiber: 0, sugar: 0.6, sodium: 62 }, category: 'protein' },
  { name: 'Greek Yogurt', brand: '', servingSize: 150, servingUnit: 'g', nutrients: { calories: 130, protein: 17, carbs: 9, fat: 2.5, fiber: 0, sugar: 7, sodium: 65 }, category: 'dairy' },
  { name: 'Oats', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10.6, sugar: 0, sodium: 2 }, category: 'grain' },
  { name: 'Salmon', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 208, protein: 20, carbs: 0, fat: 13, fiber: 0, sugar: 0, sodium: 59 }, category: 'protein' },
  { name: 'Sweet Potato', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, sugar: 4.2, sodium: 55 }, category: 'vegetable' },
  { name: 'Almonds', brand: '', servingSize: 28, servingUnit: 'g', nutrients: { calories: 164, protein: 6, carbs: 6, fat: 14, fiber: 3.5, sugar: 1.2, sodium: 0 }, category: 'fat' },
  { name: 'Milk (Whole)', brand: '', servingSize: 240, servingUnit: 'ml', nutrients: { calories: 149, protein: 8, carbs: 12, fat: 8, fiber: 0, sugar: 12, sodium: 105 }, category: 'dairy' },
  { name: 'White Rice', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 204, protein: 4.2, carbs: 45, fat: 0.4, fiber: 0.6, sugar: 0, sodium: 1 }, category: 'grain' },
  { name: 'Tuna (Canned)', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 116, protein: 26, carbs: 0, fat: 1, fiber: 0, sugar: 0, sodium: 337 }, category: 'protein' },
  { name: 'Apple', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1 }, category: 'fruit' },
  { name: 'Avocado', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 160, protein: 2, carbs: 9, fat: 15, fiber: 7, sugar: 0.7, sodium: 7 }, category: 'fat' },
  { name: 'Spinach', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79 }, category: 'vegetable' },
  { name: 'Paneer', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 265, protein: 18, carbs: 1.2, fat: 20, fiber: 0, sugar: 0, sodium: 9 }, category: 'dairy' },
  { name: 'Dal (Lentils)', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 7.9, sugar: 1.8, sodium: 2 }, category: 'protein' },
  { name: 'Chapati', brand: '', servingSize: 40, servingUnit: 'g', nutrients: { calories: 120, protein: 3.1, carbs: 18, fat: 3.7, fiber: 0.4, sugar: 0, sodium: 190 }, category: 'grain' },
  { name: 'Whey Protein Powder', brand: '', servingSize: 30, servingUnit: 'g', nutrients: { calories: 120, protein: 24, carbs: 3, fat: 1.5, fiber: 0, sugar: 2, sodium: 60 }, category: 'protein' },
  { name: 'Orange', brand: '', servingSize: 130, servingUnit: 'g', nutrients: { calories: 62, protein: 1.2, carbs: 15.4, fat: 0.2, fiber: 3.1, sugar: 12, sodium: 0 }, category: 'fruit' },
  { name: 'Cottage Cheese', brand: '', servingSize: 100, servingUnit: 'g', nutrients: { calories: 98, protein: 11, carbs: 3.4, fat: 4.3, fiber: 0, sugar: 2.7, sodium: 364 }, category: 'dairy' },
  { name: 'Peanut Butter', brand: '', servingSize: 32, servingUnit: 'g', nutrients: { calories: 190, protein: 7, carbs: 7, fat: 16, fiber: 2, sugar: 3, sodium: 147 }, category: 'fat' },
  { name: 'Coffee (Black)', brand: '', servingSize: 240, servingUnit: 'ml', nutrients: { calories: 5, protein: 0.3, carbs: 0, fat: 0.1, fiber: 0, sugar: 0, sodium: 5 }, category: 'beverage' },
  { name: 'Whole Wheat Bread', brand: '', servingSize: 28, servingUnit: 'g', nutrients: { calories: 69, protein: 3.6, carbs: 12, fat: 1, fiber: 1.9, sugar: 1.6, sodium: 132 }, category: 'grain' }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Food.deleteMany({ isPublic: true, isCustom: false });
    console.log('Cleared existing seed data');

    const foods = commonFoods.map(f => ({ ...f, isPublic: true, isCustom: false }));
    await Food.insertMany(foods);

    console.log(`Seeded ${foods.length} foods successfully`);
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seed();
