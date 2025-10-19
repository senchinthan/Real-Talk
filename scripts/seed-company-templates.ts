import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { companyTemplates } from '../constants/companyTemplates';

// Firebase configuration (you'll need to add your config here)
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

async function seedCompanyTemplates() {
  try {
    console.log('🌱 Starting to seed company templates...');

    // Check if templates already exist
    const existingTemplates = await getDocs(collection(db, 'companyTemplates'));
    if (!existingTemplates.empty) {
      console.log('⚠️  Company templates already exist. Skipping seed.');
      return;
    }

    // Add each template to Firestore
    for (const template of companyTemplates) {
      try {
        const docRef = await addDoc(collection(db, 'companyTemplates'), {
          ...template,
          createdAt: new Date().toISOString(),
        });
        console.log(`✅ Added ${template.companyName} template with ID: ${docRef.id}`);
      } catch (error) {
        console.error(`❌ Error adding ${template.companyName} template:`, error);
      }
    }

    console.log('🎉 Successfully seeded all company templates!');
  } catch (error) {
    console.error('❌ Error seeding company templates:', error);
    throw error;
  }
}

// Run the seed function if this script is executed directly
if (require.main === module) {
  seedCompanyTemplates()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    });
}

export { seedCompanyTemplates };
