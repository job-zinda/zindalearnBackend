import Course from '../../models/Course.js';

export const seedCourses = async (instructorId) => {
  await Course.deleteMany();
  console.log('Seed: Cleared existing courses');

  await Course.create([
    {
      title: 'Mastering React & Next.js',
      description: 'Complete guide to modern frontend development.',
      price: 1999,
      discountPrice: 999,
      instructor: instructorId,
      category: 'Web Development',
      level: 'Intermediate',
      status: 'published',
      isApproved: true,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800'
    },
    {
      title: 'Python for Data Science',
      description: 'Learn data analysis with Python, Pandas and NumPy.',
      price: 2499,
      discountPrice: 1499,
      instructor: instructorId,
      category: 'Data Science',
      level: 'Beginner',
      status: 'published',
      isApproved: true,
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800'
    }
  ]);
  console.log('Seed: Created Courses');
};
