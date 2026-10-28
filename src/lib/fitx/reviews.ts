/**
 * FITX's Google reviews, copied word for word from the studio's Google Maps
 * listing (newest first). Seeded into Testimonials by `npm run db:sync-knowledge`;
 * after that, the admin (Testimonials) is where they are edited or hidden.
 *
 * Reviews Google showed shortened ("… More") are left out until their full
 * text is supplied. Star ratings were not copied, so `rating` is left empty
 * and no stars are shown.
 *
 * `photo`: the reviewer's profile picture, when supplied, under
 * /images/fitx/reviews/. Without one the card shows their initials.
 */
export type Review = { name: string; text: string; photo?: string };

export const googleReviews: Review[] = [
  {
    name: "Ayesha Andlib",
    text: "I had a wonderful experience with FitX gym and specially my trainer, Iqra. She is very professional and supportive. She explains everything clearly and always motivates me to do my best. I really appreciate her dedication and positive attitude with clients.\nThankx FitX for giving a wonderful opportunity for weight loss journey.",
  },
  {
    name: "Isbah waheed",
    text: "It's rare to find a best gym in sahiwal and finally I found it. The environment of fitx is so clean, healthy and friendly you felt like home at here and the trainers are so humble . Hands down the best gym in sahiwal. Highly recommend if you found a best gym and ready to level up your body or lifestyle.",
  },
  {
    name: "Adil Abbas",
    text: "I have tried almost every gym in Sahiwal, and one thing I have learned is that fitness is not just about walking into a gym and starting a workout. The real difference comes from proper supervision and a training plan customized around your body, fitness level, goals, and medical conditions.\n\nFor me, FitX stands apart as a proper training studio rather than just another gym. Zohaib is one of the best trainers I have met. He takes the time to understand your condition, supervises your training closely, and adjusts the routine according to what your body actually needs.\n\nThat level of personalized attention is exactly what I was looking for. Proud to be part of the FitX community and would highly recommend it to anyone who takes their fitness and training seriously.",
  },
  {
    name: "Easy Food With Sani",
    text: "Amazing gym with a very positive and motivating environment. The gym is clean, well-maintained, and has good equipment. The staff is friendly and cooperative, and the overall atmosphere makes you feel comfortable and motivated. Highly recommended.\nI’m really happy with my trainer. Sir zohaib and Miss iqra is very professional, supportive, and motivating. The workouts are explained properly, and the trainer always pays attention to form and progress. I really appreciate the guidance and encouragement.",
  },
  {
    name: "Saba Shujat",
    text: "I am in love with fitness after working out with Miss Iqra ❤️ Amazing personality and a trainer who understands you like no one else. Miss Iqra is very cooperative and FitX has added a positive impact on my weight loss journey. I am more fit and eager to loose weight then I was doing irregular workouts on my own. Looking forward for more healthier progress 😊",
  },
  {
    name: "Sumaita Masood",
    text: "Oh going to gym, huh, I never thought I'll ever do it with this much consistency and motivation. My approach towards gym workouts and strength training underwent a paradigm shift because of FitX. The credit entirely goes to charming Iqra and maestro Zohaib. Both of them contribute to professional and lively environment of gym. Keep the good work up!",
  },
  {
    name: "nayab tahir",
    text: "Really good experience at this gym so far. The place is clean, the equipment is very good and the overall environment feels comfortable. The staff is friendly and trainers are helpful whenever you need guidance. I like that the gym is not just about working out, but also has a nice and motivating atmosphere. Definitely a good place for anyone who wants to stay active, consistent and want to adopt a healthy lifestyle.\nHighly recommended💪🏻\nFive Stars! Not One Of The Best, it’s Only The Best Personal Fitness Training Studio ♥️",
  },
  {
    name: "Nimra Noman",
    text: "Honestly I'm so glad I joined FITX! ❤️ Zohaib and Iqra are amazing trainers.They,re always supportive and keep me motivated throughout my workouts. I have been enjoying my journey so much, and I can really feel the difference.\nReally happy to be a part of FITX! ❤️ 💪\nHighly recommended ⭐ ✨ ❤️",
  },
  {
    name: "Rana Hamza Naeem",
    text: "My wife and I joined FitX Fitness Studio Sahiwal in Ramzan, and we’re honestly shocked by the results. In just 2 months we’ve each lost 7–8 kg, and that’s with Eid holidays, family dawats, and other casual breaks. No crash diet, no starvation — just proper guidance and sustainable routines.\n\nWhat we loved:\n1. Trainers understand real life – They designed workouts around our Ramzan/Eid schedule instead of giving excuses.\n2. Couple-friendly environment – Comfortable, respectful, and motivating for both of us to train together.\n3. Focus on consistency, not torture – No hard-and-fast diets. They taught us portion control and smart choices so we could still enjoy Eid.\n4. Clean facility + good equipment – Always maintained, no waiting for machines.\n\nIf you’re in Sahiwal and want actual results without ruining your social life, FitX is the place. Highly recommended for couples and beginners.",
  },
  {
    name: "Rk Iqra",
    text: "I had a wonderful experience at FITX Fitness Studio. The gym environment is really motivating, and the exercises were superb. I especially enjoyed working out during Ramadan; it kept me energized and on track. Highly recommend it to anyone looking for a great workout routineThanks to my coach , Iqra Zahid for the support and guidance.",
  },
  {
    name: "Arooj Arslan",
    text: "I’ve had a wonderful experience training at Fit X Gym with my trainer Iqra. She is extremely professional, motivating, and always makes sure every workout is done correctly and safely. Her guidance has really helped me stay consistent and improve my strength and fitness.\n\nIqra is not only knowledgeable but also very supportive and encouraging, which makes every training session enjoyable. The environment at Fit X Gym is also great—clean, energetic, and perfect for staying focused on fitness goals.\n\nHighly recommended for anyone looking for a dedicated trainer and a great place to work out. Thank you Iqra for your constant motivation and support!",
  },
  {
    name: "About Dogar's life",
    text: "I want to recommend you fitx personally because they put their focus and efforts on you like their own family ✨",
  },
  {
    name: "Ahmad Karam",
    text: "Five stars for FitX! The staff is incredibly welcoming and the trainers are genuinely invested in your progress. It feels more like a community than just a place to workout. Even during peak hours, the flow is good and the environment is respectful. Definitely the best spot in town for a serious workout.",
  },
  {
    name: "Muhammad Dawod",
    text: "Trainer Malik Muazam is highly professional and knowledgeable. He focuses on proper technique, personalized workout plans, and motivates clients to achieve their fitness goals. Highly recommended for anyone serious about fitness💪",
  },
  {
    name: "zoya Butt",
    text: "Fitx gym is a one's of the best gym's I have been with fitx for the three years fitx gym has helped me a lot to become mentally and physically better the best trainer at fitx miss iqra zahid ♥️ she is very understanding and supportive she always guides us we'll and motivates us to keep improving thanks fitx and Miss iqra zahid ♥️",
  },
  {
    name: "Khadija Uzair",
    text: "Great experience at FitX with trainer Iqra, Iqra is very professional and supportive she makes workouts effective and fun, she pushes you to do your best , workouts with her are always energetic and effective FitX is highly recommended, amazing gym more love to Iqra",
  },
  {
    name: "Hafiza Aneeba Majeed",
    text: "I’ve had a great experience at FitX. The environment is very welcoming and motivating. My trainer, Iqra Zahid, is highly professional and truly attentive to personal details, creating personalized plans that make workouts much more effective. Highly recommended!",
  },
  {
    name: "Rayyan Waheed",
    text: "Excellent fitness environment with very supportive trainers. Special thanks to Iqra and Zohaib for their professional guidance and personalized training. Highly recommended!",
  },
  {
    name: "Sehreen Hussain",
    text: "Had a great experience with the online sessions. Miss Iqra is very supportive, professional, and friendly, and she explains everything clearly. The sessions were effective and motivating. Highly recommended!",
  },
  {
    name: "Mehran Ahmad",
    text: "Hands down the best gym in Sahiwal! 🏋️‍♂️ It’s rare to find a place this spacious and clean that also offers such a peaceful atmosphere to train. The trainers are incredible and truly invested in your progress. Highly recommend if you're ready to level up your body and lifestyle!",
  },
  {
    name: "Hina saeed",
    text: "I have a brilliant experience with my the great trainer Iqra❤️❤️...",
  },
  {
    name: "Liba Atta",
    text: "FITX Gym is one of the best gyms. The atmosphere is great and the equipment is good. Miss Iqra is very supportive, experienced, and always encourages members to stay consistent with their workouts. Her training methods are very effective, and the results of her training are also excellent.",
  },
  {
    name: "Maria Ali",
    text: "Huge shoutout to the amazing trainer “Miss Iqra Zahid” ✨who has been my rock throughout this weight loss journey! 💪 Her motivation and support have been incredible, and I'm so grateful for her guidance. Seriously, the only best female trainer in Sahiwal! 🙌",
  },
  {
    name: "Munib Akram",
    text: "Excellent Trainers with outstanding environment.I LEARNED A LOT IN FITX.",
  },
  {
    name: "Shabroz Ali",
    text: "Highly Professional & sophisticated personal training studio in sahiwal ! Great atmosphere & personalised attention. Totally worth it .",
  },
  {
    name: "Irfan Kakar",
    text: "Bestest in the town!!!! The Gym is equipped by every kind of fitness equipments with fully trained professional staff… The staff is really supportive… All the credits goes to Zuhaib Bahi…. The owner!!!",
  },
];

/** Profile picture for a review by name, if one was supplied. */
export const reviewPhoto = (name: string) => googleReviews.find((r) => r.name === name)?.photo;
