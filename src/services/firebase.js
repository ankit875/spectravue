import app from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import firebaseConfig from "./config";

// Dummy users database for fallback authentication
const dummyUsers = {
  "test@example.com": {
    uid: "dummy-user-1",
    email: "test@example.com",
    password: "password123",
    displayName: "Test User",
    photoURL: "/static/defaultAvatar.jpg",
    metadata: { creationTime: Date.now() },
    providerData: [{ providerId: "password" }],
    profile: {
      fullname: "Test User",
      avatar: "/static/defaultAvatar.jpg",
      banner: "/static/defaultBanner.jpg",
      email: "test@example.com",
      address: "123 Demo Street, Sample City, SC 12345",
      basket: [],
      mobile: { data: { number: "+1-555-0123", country: "US" } },
      role: "USER",
      dateJoined: Date.now(),
    },
  },
  "admin@example.com": {
    uid: "dummy-admin-1",
    email: "admin@example.com",
    password: "admin123",
    displayName: "Admin User",
    photoURL: "/static/defaultAvatar.jpg",
    metadata: { creationTime: Date.now() },
    providerData: [{ providerId: "password" }],
    profile: {
      fullname: "Admin User",
      avatar: "/static/defaultAvatar.jpg",
      banner: "/static/defaultBanner.jpg",
      email: "admin@example.com",
      address: "456 Admin Avenue, Manager City, MC 67890",
      basket: [],
      mobile: { data: { number: "+1-555-0456", country: "US" } },
      role: "ADMIN",
      dateJoined: Date.now(),
    },
  },
};

// Simple storage for dummy authentication state
let currentDummyUser = null;
let isFirebaseAvailable = true;
let authStateChangeHandler = null;

class Firebase {
  constructor() {
    try {
      // Check if environment variables are properly set
      if (
        !firebaseConfig.apiKey ||
        firebaseConfig.apiKey === "undefined" ||
        firebaseConfig.apiKey === "demo-mode"
      ) {
        console.warn("Firebase API key not found, using dummy authentication");
        isFirebaseAvailable = false;
        return;
      }

      app.initializeApp(firebaseConfig);
      this.storage = app.storage();
      this.db = app.firestore();
      this.auth = app.auth();
    } catch (error) {
      console.warn(
        "Firebase initialization failed, using dummy authentication:",
        error.message
      );
      isFirebaseAvailable = false;
    }
  }

  // Method to set external auth state change handler
  setAuthStateChangeHandler = (handler) => {
    authStateChangeHandler = handler;
  };

  // Helper method to simulate Firebase auth responses
  createDummyAuthResponse = (user) => ({
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      metadata: user.metadata,
      providerData: user.providerData,
    },
  });

  // Helper method to simulate Firestore document responses
  createDummyDocResponse = (data, exists = true) => ({
    exists: () => exists,
    data: () => data,
    ref: { id: data?.uid || "dummy-id" },
  });

  // AUTH ACTIONS ------------

  createAccount = async (email, password) => {
    if (!isFirebaseAvailable) {
      // Simulate account creation with dummy data
      const uid = `dummy-user-${Date.now()}`;
      const newUser = {
        uid,
        email,
        password,
        displayName: email.split("@")[0],
        photoURL: "/static/defaultAvatar.jpg",
        metadata: { creationTime: Date.now() },
        providerData: [{ providerId: "password" }],
        profile: {
          fullname: email.split("@")[0],
          avatar: "/static/defaultAvatar.jpg",
          banner: "/static/defaultBanner.jpg",
          email,
          address: "",
          basket: [],
          mobile: { data: {} },
          role: "USER",
          dateJoined: Date.now(),
        },
      };

      // Add to dummy users database
      dummyUsers[email] = newUser;
      currentDummyUser = newUser;

      // Trigger auth state change
      setTimeout(() => {
        if (authStateChangeHandler) {
          authStateChangeHandler(newUser);
        }
        if (this.onAuthStateChangeCallback) {
          this.onAuthStateChangeCallback(newUser);
        }
      }, 100);

      return this.createDummyAuthResponse(newUser);
    }

    return this.auth.createUserWithEmailAndPassword(email, password);
  };

  signIn = async (email, password) => {
    if (!isFirebaseAvailable) {
      // Check dummy users database
      const user = dummyUsers[email];

      if (!user) {
        const error = new Error("User not found");
        error.code = "auth/user-not-found";
        throw error;
      }

      if (user.password !== password) {
        const error = new Error("Wrong password");
        error.code = "auth/wrong-password";
        throw error;
      }

      currentDummyUser = user;

      // Trigger auth state change immediately
      setTimeout(() => {
        if (authStateChangeHandler) {
          authStateChangeHandler(user);
        }
        if (this.onAuthStateChangeCallback) {
          this.onAuthStateChangeCallback(user);
        }
      }, 100);

      return this.createDummyAuthResponse(user);
    }

    return this.auth.signInWithEmailAndPassword(email, password);
  };

  signInWithGoogle = async () => {
    if (!isFirebaseAvailable) {
      const error = new Error(
        "Google sign-in not available in demo mode. Please use test@example.com / password123"
      );
      error.code = "auth/operation-not-supported-in-this-environment";
      throw error;
    }

    return this.auth.signInWithPopup(new app.auth.GoogleAuthProvider());
  };

  signInWithFacebook = async () => {
    if (!isFirebaseAvailable) {
      const error = new Error(
        "Facebook sign-in not available in demo mode. Please use test@example.com / password123"
      );
      error.code = "auth/operation-not-supported-in-this-environment";
      throw error;
    }

    return this.auth.signInWithPopup(new app.auth.FacebookAuthProvider());
  };

  signInWithGithub = async () => {
    if (!isFirebaseAvailable) {
      const error = new Error(
        "Github sign-in not available in demo mode. Please use test@example.com / password123"
      );
      error.code = "auth/operation-not-supported-in-this-environment";
      throw error;
    }

    return this.auth.signInWithPopup(new app.auth.GithubAuthProvider());
  };

  signOut = async () => {
    if (!isFirebaseAvailable) {
      currentDummyUser = null;
      // Trigger auth state change to null
      setTimeout(() => {
        if (authStateChangeHandler) {
          authStateChangeHandler(null);
        }
        if (this.onAuthStateChangeCallback) {
          this.onAuthStateChangeCallback(null);
        }
      }, 100);
      return Promise.resolve();
    }

    return this.auth.signOut();
  };

  passwordReset = async (email) => {
    if (!isFirebaseAvailable) {
      if (!dummyUsers[email]) {
        const error = new Error("User not found");
        error.code = "auth/user-not-found";
        throw error;
      }
      // Simulate password reset email sent
      return Promise.resolve();
    }

    return this.auth.sendPasswordResetEmail(email);
  };

  addUser = async (id, user) => {
    if (!isFirebaseAvailable) {
      // Store in dummy database
      const existingUser = Object.values(dummyUsers).find((u) => u.uid === id);
      if (existingUser) {
        existingUser.profile = { ...existingUser.profile, ...user };
      }
      return Promise.resolve();
    }

    return this.db.collection("users").doc(id).set(user);
  };

  getUser = async (id) => {
    if (!isFirebaseAvailable) {
      const user = Object.values(dummyUsers).find((u) => u.uid === id);
      return this.createDummyDocResponse(user?.profile, !!user);
    }

    return this.db.collection("users").doc(id).get();
  };

  passwordUpdate = async (password) => {
    if (!isFirebaseAvailable) {
      if (!currentDummyUser) {
        const error = new Error("No user signed in");
        error.code = "auth/no-current-user";
        throw error;
      }
      // Update password in dummy database
      currentDummyUser.password = password;
      return Promise.resolve("Password updated successfully!");
    }

    return this.auth.currentUser.updatePassword(password);
  };

  changePassword = async (currentPassword, newPassword) => {
    if (!isFirebaseAvailable) {
      if (!currentDummyUser) {
        const error = new Error("No user signed in");
        error.code = "auth/no-current-user";
        throw error;
      }

      if (currentDummyUser.password !== currentPassword) {
        const error = new Error("Wrong password");
        error.code = "auth/wrong-password";
        throw error;
      }

      currentDummyUser.password = newPassword;
      return Promise.resolve("Password updated successfully!");
    }

    return new Promise((resolve, reject) => {
      this.reauthenticate(currentPassword)
        .then(() => {
          const user = this.auth.currentUser;
          user
            .updatePassword(newPassword)
            .then(() => {
              resolve("Password updated successfully!");
            })
            .catch((error) => reject(error));
        })
        .catch((error) => reject(error));
    });
  };

  reauthenticate = async (currentPassword) => {
    if (!isFirebaseAvailable) {
      if (!currentDummyUser || currentDummyUser.password !== currentPassword) {
        const error = new Error("Wrong password");
        error.code = "auth/wrong-password";
        throw error;
      }
      return Promise.resolve();
    }

    const user = this.auth.currentUser;
    const cred = app.auth.EmailAuthProvider.credential(
      user.email,
      currentPassword
    );

    return user.reauthenticateWithCredential(cred);
  };

  updateEmail = async (currentPassword, newEmail) => {
    if (!isFirebaseAvailable) {
      if (!currentDummyUser) {
        const error = new Error("No user signed in");
        error.code = "auth/no-current-user";
        throw error;
      }

      if (currentDummyUser.password !== currentPassword) {
        const error = new Error("Wrong password");
        error.code = "auth/wrong-password";
        throw error;
      }

      // Update email in dummy database
      const oldEmail = currentDummyUser.email;
      currentDummyUser.email = newEmail;
      currentDummyUser.profile.email = newEmail;

      // Update the key in dummyUsers
      delete dummyUsers[oldEmail];
      dummyUsers[newEmail] = currentDummyUser;

      return Promise.resolve("Email Successfully updated");
    }

    return new Promise((resolve, reject) => {
      this.reauthenticate(currentPassword)
        .then(() => {
          const user = this.auth.currentUser;
          user
            .updateEmail(newEmail)
            .then(() => {
              resolve("Email Successfully updated");
            })
            .catch((error) => reject(error));
        })
        .catch((error) => reject(error));
    });
  };

  updateProfile = async (id, updates) => {
    if (!isFirebaseAvailable) {
      const user = Object.values(dummyUsers).find((u) => u.uid === id);
      if (user) {
        user.profile = { ...user.profile, ...updates };
      }
      return Promise.resolve();
    }

    return this.db.collection("users").doc(id).update(updates);
  };

  onAuthStateChanged = () => {
    if (!isFirebaseAvailable) {
      return new Promise((resolve, reject) => {
        this.onAuthStateChangeCallback = (user) => {
          if (user) {
            resolve(user);
          } else {
            reject(new Error("Auth State Changed failed"));
          }
        };

        // Check if user is already signed in
        if (currentDummyUser) {
          setTimeout(() => resolve(currentDummyUser), 100);
        }
      });
    }

    return new Promise((resolve, reject) => {
      this.auth.onAuthStateChanged((user) => {
        if (user) {
          resolve(user);
        } else {
          reject(new Error("Auth State Changed failed"));
        }
      });
    });
  };

  saveBasketItems = async (items, userId) => {
    if (!isFirebaseAvailable) {
      const user = Object.values(dummyUsers).find((u) => u.uid === userId);
      if (user) {
        user.profile.basket = items;
      }
      return Promise.resolve();
    }

    return this.db.collection("users").doc(userId).update({ basket: items });
  };

  setAuthPersistence = async () => {
    if (!isFirebaseAvailable) {
      // In dummy mode, persistence is automatically handled
      return Promise.resolve();
    }

    return this.auth.setPersistence(app.auth.Auth.Persistence.LOCAL);
  };

  // // PRODUCT ACTIONS --------------

  getSingleProduct = async (id) => {
    if (!isFirebaseAvailable) {
      // Define dummy products database
      const dummyProductsDB = {
        "dummy-1": {
          id: "dummy-1",
          name: "Premium Wireless Headphones",
          brand: "AudioTech",
          price: 5.99,
          description:
            "High-quality wireless headphones with advanced noise cancellation technology. Perfect for music lovers and professionals who demand the best audio experience.",
          image: "/static/salt-image-1.png",
          isFeatured: true,
          isRecommended: false,
          availableColors: ["#000000", "#ffffff"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 50,
          keywords: ["headphones", "wireless", "audio", "noise cancellation"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-1.png" },
            { id: "2", url: "/static/salt-image-2.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-2": {
          id: "dummy-2",
          name: "Smart Fitness Watch",
          brand: "FitTech",
          price: 1.99,
          description:
            "Advanced fitness tracking smartwatch with heart rate monitoring, GPS, and long-lasting battery. Track your workouts and stay connected throughout the day.",
          image: "/static/salt-image-2.png",
          isFeatured: true,
          isRecommended: true,
          availableColors: ["#000000", "#0066cc"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 75,
          keywords: ["watch", "fitness", "smart", "heart rate", "GPS"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-2.png" },
            { id: "2", url: "/static/salt-image-3.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-3": {
          id: "dummy-3",
          name: "Portable Bluetooth Speaker",
          brand: "SoundWave",
          price: 3.99,
          description:
            "Compact yet powerful Bluetooth speaker with exceptional sound quality and 12-hour battery life. Perfect for outdoor adventures and indoor entertainment.",
          image: "/static/salt-image-3.png",
          isFeatured: true,
          isRecommended: false,
          availableColors: ["#ff0000", "#00ff00", "#0000ff"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 100,
          keywords: ["speaker", "bluetooth", "portable", "wireless", "music"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-3.png" },
            { id: "2", url: "/static/salt-image-4.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-4": {
          id: "dummy-4",
          name: "Wireless Charging Pad",
          brand: "ChargeTech",
          price: 4.99,
          description:
            "Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design with LED indicator and overheat protection for safe charging.",
          image: "/static/salt-image-4.png",
          isFeatured: true,
          isRecommended: true,
          availableColors: ["#000000", "#ffffff"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 80,
          keywords: ["charger", "wireless", "fast", "Qi", "charging pad"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-4.png" },
            { id: "2", url: "/static/salt-image-5.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-5": {
          id: "dummy-5",
          name: "Gaming Mechanical Keyboard",
          brand: "GameTech",
          price: 5.99,
          description:
            "RGB backlit mechanical keyboard with customizable keys for the ultimate gaming experience. Cherry MX switches provide tactile feedback and durability.",
          image: "/static/salt-image-5.png",
          isFeatured: false,
          isRecommended: true,
          availableColors: ["#000000", "#ff0000"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 60,
          keywords: ["keyboard", "gaming", "mechanical", "RGB", "switches"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-5.png" },
            { id: "2", url: "/static/salt-image-1.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-6": {
          id: "dummy-6",
          name: "Ergonomic Office Chair",
          brand: "ComfortPlus",
          price: 3.99,
          description:
            "Premium ergonomic office chair with lumbar support, adjustable height, and breathable mesh back. Designed for all-day comfort and productivity.",
          image: "/static/salt-image-7.png",
          isFeatured: false,
          isRecommended: true,
          availableColors: ["#000000", "#808080"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 25,
          keywords: ["chair", "office", "ergonomic", "comfort", "lumbar"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-7.png" },
            { id: "2", url: "/static/salt-image-2.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-7": {
          id: "dummy-7",
          name: "4K Ultra HD Monitor",
          brand: "ViewTech",
          price: 7.99,
          description:
            "Stunning 27-inch 4K UHD monitor with vibrant colors and sharp details. Ideal for gaming, graphic design, and immersive entertainment.",
          image: "/static/salt-image-6.png",
          isFeatured: true,
          isRecommended: false,
          availableColors: ["#000000", "#ffffff"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 30,
          keywords: ["monitor", "4K", "UHD", "display", "gaming"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-6.png" },
            { id: "2", url: "/static/salt-image-3.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-8": {
          id: "dummy-8",
          name: "Noise-Cancelling Earbuds",
          brand: "SoundBuds",
          price: 2.99,
          description:
            "Compact noise-cancelling earbuds with superior sound quality and secure fit. Perfect for on-the-go listening and workouts.",
          image: "/static/salt-image-8.png",
          isFeatured: false,
          isRecommended: true,
          availableColors: ["#000000", "#ffffff", "#ff69b4"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 90,
          keywords: ["earbuds", "noise-cancelling", "wireless", "audio"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-8.png" },
            { id: "2", url: "/static/salt-image-4.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-9": {
          id: "dummy-9",
          name: "Smart Home Hub",
          brand: "HomeTech",
          price: 6.99,
          description:
            "Central smart home hub that connects and controls all your smart devices. Compatible with Alexa, Google Assistant, and Apple HomeKit.",
          image: "/static/salt-image-9.png",
          isFeatured: true,
          isRecommended: false,
          availableColors: ["#000000", "#ffffff"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 40,
          keywords: ["smart home", "hub", "automation", "IoT"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-9.png" },
            { id: "2", url: "/static/salt-image-5.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-10": {
          id: "dummy-10",
          name: "Action Camera 4K", 
          brand: "CamPro",
          price: 8.99,
          description:
            "Durable action camera with 4K recording, waterproof design, and wide-angle lens. Capture your adventures in stunning detail.",
          image: "/static/salt-image-10.png",
          isFeatured: false,
          isRecommended: true,
          availableColors: ["#000000", "#00ff00"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 55,
          keywords: ["camera", "action", "4K", "waterproof", "adventure"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-10.png" },
            { id: "2", url: "/static/salt-image-1.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-11": {
          id: "dummy-11",
          name: "Electric Toothbrush",
          brand: "SmileTech",
          price: 1.49,
          description:
            "Rechargeable electric toothbrush with multiple brushing modes and a built-in timer. Achieve a superior clean and healthier gums.",
          image: "/static/salt-image-11.png",
          isFeatured: false,
          isRecommended: false,
          availableColors: ["#000000", "#ffffff", "#ff69b4"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 120,
          keywords: ["toothbrush", "electric", "oral care", "dental"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-11.png" },
            { id: "2", url: "/static/salt-image-2.png" },
          ],
          dateAdded: Date.now(),
        },
        "dummy-12": {
          id: "dummy-12",
          name: "Laptop Backpack",
          brand: "BagPro",
          price: 4.49,
          description:
            "Stylish and durable laptop backpack with multiple compartments and padded laptop sleeve. Perfect for work, school, and travel.",
          image: "/static/salt-image-12.png",
          isFeatured: true,
          isRecommended: true,
          availableColors: ["#000000", "#808080", "#0066cc"],
          sizes: ["28", "36", "42"],
          quantity: 1,
          maxQuantity: 70,
          keywords: ["backpack", "laptop", "bag", "travel", "school"],
          imageCollection: [
            { id: "1", url: "/static/salt-image-12.png" },
            { id: "2", url: "/static/salt-image-3.png" },
          ],
          dateAdded: Date.now(),
        },
      };

      const product = dummyProductsDB[id];

      // Create Firestore-like document response
      const mockDoc = {
        exists: !!product,
        data: () => product,
        ref: { id: product?.id || id },
      };

      return Promise.resolve(mockDoc);
    }

    return this.db.collection("products").doc(id).get();
  };

  getProducts = (lastRefKey) => {
    let didTimeout = false;

    return new Promise((resolve, reject) => {
      (async () => {
        if (!isFirebaseAvailable) {
          // Define dummy products database
          const dummyProductsDB = {
            "dummy-1": {
              id: "dummy-1",
              name: "Premium Wireless Headphones",
              brand: "AudioTech",
              price: 2.99,
              description:
                "High-quality wireless headphones with advanced noise cancellation technology. Perfect for music lovers and professionals who demand the best audio experience.",
              image: "/static/salt-image-1.png",
              isFeatured: true,
              isRecommended: false,
              availableColors: ["#000000", "#ffffff"],
              sizes: ["28", "36", "42"],
              quantity: 1,
              maxQuantity: 50,
              keywords: ["headphones", "wireless", "audio", "noise cancellation"],
              imageCollection: [
                { id: "1", url: "/static/salt-image-1.png" },
                { id: "2", url: "/static/salt-image-2.png" },
              ],
              dateAdded: Date.now(),
            },
            "dummy-2": {
              id: "dummy-2",
              name: "Smart Fitness Watch",
              brand: "FitTech",
              price: 1.99,
              description:
                "Advanced fitness tracking smartwatch with heart rate monitoring, GPS, and long-lasting battery. Track your workouts and stay connected throughout the day.",
              image: "/static/salt-image-2.png",
              isFeatured: true,
              isRecommended: true,
              availableColors: ["#000000", "#0066cc"],
              sizes: ["28", "36", "42"],
              quantity: 1,
              maxQuantity: 75,
              keywords: ["watch", "fitness", "smart", "heart rate", "GPS"],
              imageCollection: [
                { id: "1", url: "/static/salt-image-2.png" },
                { id: "2", url: "/static/salt-image-3.png" },
              ],
              dateAdded: Date.now(),
            },
            "dummy-3": {
              id: "dummy-3",
              name: "Portable Bluetooth Speaker",
              brand: "SoundWave",
              price: 4.99,
              description:
                "Compact yet powerful Bluetooth speaker with exceptional sound quality and 12-hour battery life. Perfect for outdoor adventures and indoor entertainment.",
              image: "/static/salt-image-3.png",
              isFeatured: true,
              isRecommended: false,
              availableColors: ["#ff0000", "#00ff00", "#0000ff"],
              sizes: ["28", "36", "42"],
              quantity: 1,
              maxQuantity: 100,
              keywords: ["speaker", "bluetooth", "portable", "wireless", "music"],
              imageCollection: [
                { id: "1", url: "/static/salt-image-3.png" },
                { id: "2", url: "/static/salt-image-4.png" },
              ],
              dateAdded: Date.now(),
            },
            "dummy-4": {
              id: "dummy-4",
              name: "Wireless Charging Pad",
              brand: "ChargeTech",
              price: 9.99,
              description:
                "Fast wireless charging pad compatible with all Qi-enabled devices. Sleek design with LED indicator and overheat protection for safe charging.",
              image: "/static/salt-image-4.png",
              isFeatured: true,
              isRecommended: true,
              availableColors: ["#000000", "#ffffff"],
              sizes: ["28", "36", "42"],
              quantity: 1,
              maxQuantity: 80,
              keywords: ["charger", "wireless", "fast", "Qi", "charging pad"],
              imageCollection: [
                { id: "1", url: "/static/salt-image-4.png" },
                { id: "2", url: "/static/salt-image-5.png" },
              ],
              dateAdded: Date.now(),
            },
            "dummy-5": {
              id: "dummy-5",
              name: "Gaming Mechanical Keyboard",
              brand: "GameTech",
              price: 5.99,
              description:
                "RGB backlit mechanical keyboard with customizable keys for the ultimate gaming experience. Cherry MX switches provide tactile feedback and durability.",
              image: "/static/salt-image-5.png",
              isFeatured: false,
              isRecommended: true,
              availableColors: ["#000000", "#ff0000"],
              sizes: ["28", "36", "42"],
              quantity: 1,
              maxQuantity: 60,
              keywords: ["keyboard", "gaming", "mechanical", "RGB", "switches"],
              imageCollection: [
                { id: "1", url: "/static/salt-image-5.png" },
                { id: "2", url: "/static/salt-image-1.png" },
              ],
              dateAdded: Date.now(),
            },
            "dummy-6": {
              id: "dummy-6",
              name: "Ergonomic Office Chair",
              brand: "ComfortPlus",
              price: 2.99,
              description:
                "Premium ergonomic office chair with lumbar support, adjustable height, and breathable mesh back. Designed for all-day comfort and productivity.",
              image: "/static/salt-image-7.png",
              isFeatured: false,
              isRecommended: true,
              availableColors: ["#000000", "#808080"],
              sizes: ["28", "36", "42"],
              quantity: 1,
              maxQuantity: 25,
              keywords: ["chair", "office", "ergonomic", "comfort", "lumbar"],
              imageCollection: [
                { id: "1", url: "/static/salt-image-7.png" },
                { id: "2", url: "/static/salt-image-2.png" },
              ],
              dateAdded: Date.now(),
            },
            "dummy-7": {
              id: "dummy-7",
              name: "4K Ultra HD Monitor",
              brand: "ViewTech",
              price: 3.99,
              description:
                "Stunning 27-inch 4K UHD monitor with vibrant colors and sharp details. Ideal for gaming, graphic design, and immersive entertainment.",
              image: "/static/salt-image-10.png",
              isFeatured: true,
              isRecommended: false,
              availableColors: ["#000000", "#ffffff"],
              sizes: ["28", "36", "42"],
              quantity: 1,
              maxQuantity: 30,
              keywords: ["monitor", "4K", "UHD", "display", "gaming"],
              imageCollection: [
                { id: "1", url: "/static/salt-image-10.png" },
                { id: "2", url: "/static/salt-image-3.png" },
              ],
              dateAdded: Date.now(),
            },
            "dummy-8": {
              id: "dummy-8",
              name: "Wireless Gaming Mouse",
              brand: "GameTech",
              price: 7.99,
              description:
                "High-precision wireless gaming mouse with RGB lighting and programmable buttons. Ergonomic design for extended gaming sessions.",
              image: "/static/salt-image-1.png",
              isFeatured: false,
              isRecommended: true,
              availableColors: ["#000000", "#ff0000", "#0066cc"],
              sizes: ["28", "36", "42"],
              quantity: 1,
              maxQuantity: 90,
              keywords: ["mouse", "gaming", "wireless", "RGB", "precision"],
              imageCollection: [
                { id: "1", url: "/static/salt-image-1.png" },
                { id: "2", url: "/static/salt-image-4.png" },
              ],
              dateAdded: Date.now(),
            }
          };

          // Convert to array and simulate pagination
          const productsArray = Object.values(dummyProductsDB);
          const total = productsArray.length;
          
          // Simulate pagination
          const pageSize = 12;
          let startIndex = 0;
          
          if (lastRefKey) {
            const lastKeyIndex = productsArray.findIndex(p => p.id === lastRefKey);
            startIndex = lastKeyIndex >= 0 ? lastKeyIndex + 1 : 0;
          }
          
          const products = productsArray.slice(startIndex, startIndex + pageSize);
          const lastKey = products.length > 0 ? products[products.length - 1].id : null;
          
          // Simulate async operation
          setTimeout(() => {
            resolve({ products, lastKey, total });
          }, 500);
          
          return;
        }

        if (lastRefKey) {
          try {
            const query = this.db
              .collection("products")
              .orderBy(app.firestore.FieldPath.documentId())
              .startAfter(lastRefKey)
              .limit(12);

            const snapshot = await query.get();
            const products = [];
            snapshot.forEach((doc) =>
              products.push({ id: doc.id, ...doc.data() })
            );
            const lastKey = snapshot.docs[snapshot.docs.length - 1];

            resolve({ products, lastKey });
          } catch (e) {
            reject(e?.message || ":( Failed to fetch products.");
          }
        } else {
          const timeout = setTimeout(() => {
            didTimeout = true;
            reject(new Error("Request timeout, please try again"));
          }, 15000);

          try {
            const totalQuery = await this.db.collection("products").get();
            const total = totalQuery.docs.length;
            const query = this.db
              .collection("products")
              .orderBy(app.firestore.FieldPath.documentId())
              .limit(12);
            const snapshot = await query.get();

            clearTimeout(timeout);
            if (!didTimeout) {
              const products = [];
              snapshot.forEach((doc) =>
                products.push({ id: doc.id, ...doc.data() })
              );
              const lastKey = snapshot.docs[snapshot.docs.length - 1];

              resolve({ products, lastKey, total });
            }
          } catch (e) {
            if (didTimeout) return;
            reject(e?.message || ":( Failed to fetch products.");
          }
        }
      })();
    });
  };

  searchProducts = (searchKey) => {
    let didTimeout = false;

    return new Promise((resolve, reject) => {
      (async () => {
        const productsRef = this.db.collection("products");

        const timeout = setTimeout(() => {
          didTimeout = true;
          reject(new Error("Request timeout, please try again"));
        }, 15000);

        try {
          const searchedNameRef = productsRef
            .orderBy("name_lower")
            .where("name_lower", ">=", searchKey)
            .where("name_lower", "<=", `${searchKey}\uf8ff`)
            .limit(12);
          const searchedKeywordsRef = productsRef
            .orderBy("dateAdded", "desc")
            .where("keywords", "array-contains-any", searchKey.split(" "))
            .limit(12);

          // const totalResult = await totalQueryRef.get();
          const nameSnaps = await searchedNameRef.get();
          const keywordsSnaps = await searchedKeywordsRef.get();
          // const total = totalResult.docs.length;

          clearTimeout(timeout);
          if (!didTimeout) {
            const searchedNameProducts = [];
            const searchedKeywordsProducts = [];
            let lastKey = null;

            if (!nameSnaps.empty) {
              nameSnaps.forEach((doc) => {
                searchedNameProducts.push({ id: doc.id, ...doc.data() });
              });
              lastKey = nameSnaps.docs[nameSnaps.docs.length - 1];
            }

            if (!keywordsSnaps.empty) {
              keywordsSnaps.forEach((doc) => {
                searchedKeywordsProducts.push({ id: doc.id, ...doc.data() });
              });
            }

            // MERGE PRODUCTS
            const mergedProducts = [
              ...searchedNameProducts,
              ...searchedKeywordsProducts,
            ];
            const hash = {};

            mergedProducts.forEach((product) => {
              hash[product.id] = product;
            });

            resolve({ products: Object.values(hash), lastKey });
          }
        } catch (e) {
          if (didTimeout) return;
          reject(e);
        }
      })();
    });
  };

  getFeaturedProducts = async (itemsCount = 12) => {
    if (!isFirebaseAvailable) {
      // Return dummy featured products in Firestore-like format
      const dummyFeaturedProducts = [
        {
          id: "dummy-1",
          name: "Premium Wireless Headphones",
          brand: "AudioTech",
          price: 9.99,
          description:
            "High-quality wireless headphones with noise cancellation",
          image: "/static/salt-image-1.png",
          isFeatured: true,
          availableColors: ["#000000", "#ffffff"],
          sizes: ["28", "36", "42"],
          quantity: 50,
          keywords: ["headphones", "wireless", "audio"],
        },
        {
          id: "dummy-2",
          name: "Smart Fitness Watch",
          brand: "FitTech",
          price: 199.99,
          description: "Advanced fitness tracking with heart rate monitoring",
          image: "/static/salt-image-2.png",
          isFeatured: true,
          availableColors: ["#000000", "#0066cc"],
          sizes: ["28", "36", "42"],
          quantity: 75,
          keywords: ["watch", "fitness", "smart"],
        },
        {
          id: "dummy-3",
          name: "Portable Bluetooth Speaker",
          brand: "SoundWave",
          price: 8.99,
          description:
            "Compact speaker with powerful sound and long battery life",
          image: "/static/salt-image-3.png",
          isFeatured: true,
          availableColors: ["#ff0000", "#00ff00", "#0000ff"],
          sizes: ["28", "36", "42"],
          quantity: 100,
          keywords: ["speaker", "bluetooth", "portable"],
        },
        {
          id: "dummy-4",
          name: "Wireless Charging Pad",
          brand: "ChargeTech",
          price: 4.99,
          description: "Fast wireless charging for all compatible devices",
          image: "/static/salt-image-4.png",
          isFeatured: true,
          availableColors: ["#000000", "#ffffff"],
          sizes: ["28", "36", "42"],
          quantity: 80,
          keywords: ["charger", "wireless", "fast"],
        },
        {
          id: "dummy-7",
          name: "Ultra HD Webcam",
          brand: "VisionTech",
          price: 12.99,
          description: "4K webcam with auto-focus and noise-canceling microphone for professional video calls",
          image: "/static/salt-image-6.png",
          isFeatured: true,
          availableColors: ["#000000"],
          sizes: ["28", "36", "42"],
          quantity: 45,
          keywords: ["webcam", "4K", "video", "microphone"],
        },
        {
          id: "dummy-8",
          name: "Wireless Gaming Mouse",
          brand: "GamePro",
          price: 7.99,
          description: "High-precision wireless gaming mouse with customizable RGB lighting and programmable buttons",
          image: "/static/salt-image-8.png",
          isFeatured: true,
          availableColors: ["#000000", "#ff0000", "#00ff00"],
          sizes: ["28", "36", "42"],
          quantity: 90,
          keywords: ["mouse", "gaming", "wireless", "RGB", "precision"],
        },
        {
          id: "dummy-9",
          name: "Portable SSD Drive",
          brand: "DataVault",
          price: 15.99,
          description: "1TB portable SSD with USB-C connectivity and ultra-fast transfer speeds",
          image: "/static/salt-image-9.png",
          isFeatured: true,
          availableColors: ["#000000", "#0066cc"],
          sizes: ["28", "36", "42"],
          quantity: 70,
          keywords: ["SSD", "storage", "portable", "USB-C", "fast"],
        },
        {
          id: "dummy-10",
          name: "Smart LED Desk Lamp",
          brand: "BrightSpace",
          price: 6.99,
          description: "Adjustable LED desk lamp with wireless charging base and touch controls",
          image: "/static/salt-image-10.png",
          isFeatured: true,
          availableColors: ["#ffffff", "#000000"],
          sizes: ["28", "36", "42"],
          quantity: 55,
          keywords: ["lamp", "LED", "desk", "wireless charging", "smart"],
        },
        {
          id: "dummy-11",
          name: "Noise-Canceling Earbuds",
          brand: "SoundPure",
          price: 9.99,
          description: "True wireless earbuds with active noise cancellation and 8-hour battery life",
          image: "/static/salt-image-11.png",
          isFeatured: true,
          availableColors: ["#000000", "#ffffff", "#ff0000"],
          sizes: ["28", "36", "42"],
          quantity: 120,
          keywords: ["earbuds", "wireless", "noise canceling", "battery"],
        },
        {
          id: "dummy-12",
          name: "Multi-Port USB Hub",
          brand: "ConnectMax",
          price: 3.99,
          description: "7-in-1 USB hub with HDMI output, SD card reader, and fast charging ports",
          image: "/static/salt-image-12.png",
          isFeatured: true,
          availableColors: ["#808080", "#000000"],
          sizes: ["28", "36", "42"],
          quantity: 85,
          keywords: ["USB hub", "HDMI", "SD card", "charging", "multi-port"],
        },
      ];

      const limitedProducts = dummyFeaturedProducts.slice(0, itemsCount);

      // Create Firestore-like response object
      const mockSnapshot = {
        empty: limitedProducts.length === 0,
        forEach: (callback) => {
          limitedProducts.forEach((product) => {
            callback({
              data: () => product,
              ref: { id: product.id },
            });
          });
        },
        docs: limitedProducts.map((product) => ({
          data: () => product,
          ref: { id: product.id },
        })),
      };

      return Promise.resolve(mockSnapshot);
    }

    return this.db
      .collection("products")
      .where("isFeatured", "==", true)
      .limit(itemsCount)
      .get();
  };

  getRecommendedProducts = async (itemsCount = 12) => {
    if (!isFirebaseAvailable) {
      // Return dummy recommended products in Firestore-like format
      const dummyRecommendedProducts = [
        {
          id: "dummy-2",
          name: "Smart Fitness Watch",
          brand: "FitTech",
          price: 1.99,
          description: "Advanced fitness tracking with heart rate monitoring",
          image: "/static/salt-image-2.png",
          isFeatured: true,
          isRecommended: true,
          availableColors: ["#000000", "#0066cc"],
          sizes: ["28", "36", "42"],
          quantity: 75,
          keywords: ["watch", "fitness", "smart"],
        },
        {
          id: "dummy-4",
          name: "Wireless Charging Pad",
          brand: "ChargeTech",
          price: 4.99,
          description: "Fast wireless charging for all compatible devices",
          image: "/static/salt-image-4.png",
          isFeatured: true,
          isRecommended: true,
          availableColors: ["#000000", "#ffffff"],
          sizes: ["28", "36", "42"],
          quantity: 80,
          keywords: ["charger", "wireless", "fast"],
        },
        {
          id: "dummy-5",
          name: "Gaming Mechanical Keyboard",
          brand: "GameTech",
          price: 1.99,
          description: "RGB backlit mechanical keyboard with customizable keys",
          image: "/static/salt-image-5.png",
          isFeatured: false,
          isRecommended: true,
          availableColors: ["#000000", "#ff0000"],
          sizes: ["28", "36", "42"],
          quantity: 60,
          keywords: ["keyboard", "gaming", "mechanical", "RGB"],
        },
        {
          id: "dummy-6",
          name: "Ergonomic Office Chair",
          brand: "ComfortPlus",
          price: 3.99,
          description: "Premium ergonomic chair with lumbar support",
          image: "/static/salt-image-7.png",
          isFeatured: false,
          isRecommended: true,
          availableColors: ["#000000", "#808080"],
          sizes: ["28", "36", "42"],
          quantity: 25,
          keywords: ["chair", "office", "ergonomic", "comfort"],
        },
      ];

      const limitedProducts = dummyRecommendedProducts.slice(0, itemsCount);

      // Create Firestore-like response object
      const mockSnapshot = {
        empty: limitedProducts.length === 0,
        forEach: (callback) => {
          limitedProducts.forEach((product) => {
            callback({
              data: () => product,
              ref: { id: product.id },
            });
          });
        },
        docs: limitedProducts.map((product) => ({
          data: () => product,
          ref: { id: product.id },
        })),
      };

      return Promise.resolve(mockSnapshot);
    }

    return this.db
      .collection("products")
      .where("isRecommended", "==", true)
      .limit(itemsCount)
      .get();
  };

  addProduct = (id, product) =>
    this.db.collection("products").doc(id).set(product);

  generateKey = () => this.db.collection("products").doc().id;

  storeImage = async (id, folder, imageFile) => {
    const snapshot = await this.storage.ref(folder).child(id).put(imageFile);
    const downloadURL = await snapshot.ref.getDownloadURL();

    return downloadURL;
  };

  deleteImage = (id) => this.storage.ref("products").child(id).delete();

  editProduct = (id, updates) =>
    this.db.collection("products").doc(id).update(updates);

  removeProduct = (id) => this.db.collection("products").doc(id).delete();
}

const firebaseInstance = new Firebase();

export default firebaseInstance;
