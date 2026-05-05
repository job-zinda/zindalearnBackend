

import CategorySchema from "./Models/Category.js";

export default async function seedDefaultCategories() {
  const defaultCategories = [
    {
      key: "online_tuition",
      title: "Online Tuition",
      description: "Online tuition courses",
      image: "",
      isActive: true,
      order: 1,
    },
    {
      key: "talent_base",
      title: "Talent Base Courses",
      description: "Talent based courses",
      image: "",
      isActive: true,
      order: 2,
    },
    {
      key: "skill_base",
      title: "Skill Base Courses",
      description: "Skill based courses",
      image: "",
      isActive: true,
      order: 3,
    },
  ];

  for (const item of defaultCategories) {
    await CategorySchema.findOneAndUpdate(
      { key: item.key },
      { $setOnInsert: item },
      { upsert: true, new: true }
    );
  }

  console.log("✅ Default categories ensured");
}