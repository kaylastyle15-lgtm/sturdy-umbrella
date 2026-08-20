/* ==========================================================================
   questions.js — THE QUESTIONS (the one place to change your survey)
   --------------------------------------------------------------------------
   Iowa State Fair personality quiz. Same engine as before: the sign-up form
   renders from this list, and the matcher scores people by comparing their
   answers. You do NOT need to touch the database or the matching code to
   change questions — name/email/age are collected separately in the identity
   step (see app.js), everything else lives here.

   Each question object:
     id      — short unique key. Becomes how the answer is stored/compared.
     type    — "select" | "text" | "multi"
     label   — the question shown to the person.
     options — the choices (for "select" and "multi").
     branch  — (optional) { "OptionValue": [ ...follow-up question objects ] }
     scored  — (optional, default true) whether this answer counts toward the
               match score. Set false for free-text / identity fields you
               don't want compared directly.
   ========================================================================== */

window.QUESTIONS = [

  // Safety/comfort preferences. NOTE: these are currently just scored like any
  // other answer — for a real fair meetup, treat them as hard filters instead
  // (copy the age-gate pattern in match.js's HARD_RULES) before this ships.
  {
    id: "ageRangePref",
    type: "select",
    label: "What age range do you prefer your fair buddy to be in?",
    options: ["Close to my age", "A few years older or younger is fine", "Doesn't matter to me"],
  },
  {
    id: "gender",
    type: "select",
    label: "What's your gender?",
    options: ["Woman", "Man", "Non-binary", "Prefer not to say"],
    scored: false,
  },
  {
    id: "genderPref",
    type: "multi",
    label: "Which genders are you comfortable matching with?",
    options: ["Woman", "Man", "Non-binary", "Any"],
    scored: false,
  },

  // Personality-quiz questions.
  {
    id: "firstThing",
    type: "select",
    label: "What's the first thing you do at the fair?",
    options: ["Grab food", "Ride something", "Watch a show", "Check out the animals/exhibits", "Wander and see what's there"],
  },
  {
    id: "rideType",
    type: "multi",
    label: "What type of rides do you like, or any?",
    options: ["Thrill rides / roller coasters", "Slow, scenic rides", "Kiddie rides", "Not really into rides"],
  },
  {
    id: "fairFood",
    type: "select",
    label: "What's your favorite fair food?",
    options: ["Corn dog", "Funnel cake", "Deep-fried treats on a stick", "Turkey leg", "Lemonade", "Ice cream", "Something else"],
  },
  {
    id: "competing",
    type: "select",
    label: "Are you competing for prizes at the booth?",
    options: ["Yes", "No"],
  },
  {
    id: "favoriteMemory",
    type: "text",
    label: "What's your favorite state fair memory?",
    scored: false,
  },

  // Logistics.
  {
    id: "availableDays",
    type: "multi",
    label: "Which days are you available for the fair?",
    options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  },
  {
    id: "timePref",
    type: "select",
    label: "What time do you prefer to go to the fair?",
    options: ["Morning", "Afternoon", "Evening", "Late night"],
  },

  // THE MAIN SIGNAL — this is the field ruleScore weights highest (see the
  // "activities" bonus line in functions/api/match.js).
  {
    id: "activities",
    type: "multi",
    label: "Check the activities you're most interested in",
    options: [
      "Thrill Zone",
      "Thrill Ville",
      "Truck and Tractor Pulls",
      "Demolition Derby",
      "Figure 8 races",
      "Thrill Town",
      "Ye Old Mill (historic, slow-moving water tunnel dark ride)",
      "Sky Glider (scenic overhead chairlift ride)",
      "People's Choice Best New Food competition",
      "Food/bake-off competitions",
      "Trying out good fair food, like deep-fried treats on a stick, corn dogs, funnel cakes",
      "Wine Down in the Garden",
      "Grand-Slamming It All (livestock judging, ride hopping, and grandstand shows)",
      "Fair After Dark (late-night adult events at the Animal Learning Center)",
      "Full Grounds Exploration (exhibition buildings, machinery grounds, street acts)",
      "Grandstand Concerts",
      "Free Entertainment Stages",
      "Fair Purist",
      "The Butter Cow",
      "Agricultural Exhibits",
      "Giant Slide",
      "Pioneer Hall & State Competitions",
      "Monster arm wrestling",
      "Husband-calling",
      "Hog-calling",
      "Wandering the Midways",
    ],
  },

];
