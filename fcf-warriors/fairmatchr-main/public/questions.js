/* ==========================================================================
   questions.js — THE QUESTIONS (the one place to change your survey)
   --------------------------------------------------------------------------
   FCF Warriors — Iowa State Fair personality match. Swap these out and the
   whole app updates: the sign-up form renders from this list, and the
   matcher scores people by comparing their answers.

   Each question object:
     id      — short unique key. Becomes how the answer is stored/compared.
     type    — "select" | "text" | "multi"
     label   — the question shown to the person.
     options — the choices (for "select" and "multi").
     branch  — (optional) { "OptionValue": [ ...follow-up question objects ] }
     scored  — (optional, default true) whether this answer counts toward the
               match score. Set false for free-text you don't want compared.
   ========================================================================== */

window.QUESTIONS = [

  // This answer also feeds a hard safety rule in match.js: we never pair a
  // "Fair food" person with a "Rollercoasters" person — too far apart.
  {
    id: "firstThing",
    type: "select",
    label: "What's the first thing you do at the fair?",
    options: ["Fair food", "Rollercoasters", "Livestock barns", "Butter cow", "Grandstand shows"],
  },

  {
    id: "favoriteRides",
    type: "multi",
    label: "Favorite rides? (pick any)",
    options: ["Ferris wheel", "Rollercoasters", "Bumper cars", "Skyglider", "Giant slide"],
  },

  {
    id: "fairFood",
    type: "select",
    label: "What's your go-to fair food?",
    options: ["Corn dog", "Deep-fried Oreos", "Pork chop on a stick", "Turkey leg", "Lemonade shake-up"],
  },

  {
    id: "prizes",
    type: "select",
    label: "What kind of prize are you chasing?",
    options: ["Giant stuffed animal", "Ribbon/blue ribbon", "Carnival trinket", "None, I'm just here for the food"],
  },

  {
    id: "memory",
    type: "text",
    label: "What's your favorite State Fair memory?",
    scored: false,
  },

];
