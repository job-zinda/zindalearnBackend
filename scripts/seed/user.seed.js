import User from '../../models/User.js';

export const seedUsers = async () => {
  try {
   
    if (process.env.NODE_ENV === "production") {
      console.log(" Seeding is disabled in production");
      return;
    }

    console.log(" Seeding users...");


    const existingAdmin = await User.findOne({
      email: process.env.ADMIN_EMAIL || 'admin@zindalearn.com'
    });

    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: process.env.ADMIN_EMAIL || 'admin@zindalearn.com',
        password: process.env.ADMIN_PASSWORD || 'admin123',
        role: 'admin',
        isApproved: true
      });

      console.log(' Admin created');
    } else {
      console.log(' Admin already exists');
    }


    if (process.env.NODE_ENV === "development") {
      const existingInstructor = await User.findOne({
        email: 'mohammed@zindalearn.com'
      });

      if (!existingInstructor) {
        await User.create({
          name: 'Ihsan Mohammed',
          email: 'mohammed@zindalearn.com',
          password: 'instructor123',
          role: 'instructor',
          isApproved: true,
          bio: 'Expert React and Full-Stack Developer'
        });

        console.log(' Instructor created');
      }
    }

    if (process.env.NODE_ENV === "development") {
      const existingStudent = await User.findOne({
        email: 'mhdihsan@gmail.com'
      });

      if (!existingStudent) {
        await User.create({
          name: 'Mhd Ihsan',
          email: 'mhdihsan@gmail.com',
          password: 'student123',
          role: 'student',
          isApproved: true
        });

        console.log(' Student created');
      }
    }

    // Final return for seeder orchestration
    const admin = await User.findOne({ role: 'admin' });
    const instructor = await User.findOne({ role: 'instructor' });
    const student = await User.findOne({ role: 'student' });
    
    return { admin, instructor, student };

  } catch (error) {
    console.error(" Seeding error:", error);
    return {};
  }
};