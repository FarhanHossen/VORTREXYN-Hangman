/**
 * constants/words.ts
 *
 * Master word list and difficulty system for VORTREXYN Hangman.
 *
 * ── File structure ───────────────────────────────────────────────────────
 *
 *  1. WordEntry type + compact `w()` builder
 *  2. WORD_CATEGORIES — free-play category word lists (8 categories)
 *  3. DIFFICULTIES — metadata for the four difficulty tiers
 *  4. MAX_WRONG — maximum wrong guesses before a game is lost (6)
 *  5. EASY_TIERS, MEDIUM_TIERS, HARD_TIERS, EXTREME_TIERS
 *       Tiered word lists for difficulty mode.  Each tier array has
 *       3 sub-tiers indexed 0/1/2 (Starter / Getting Tricky / Expert).
 *  6. Exported helper functions (see individual JSDoc below)
 *
 * ── Difficulty mode design ───────────────────────────────────────────────
 *
 * Each difficulty has 3 internal tiers (Starter, Getting Tricky, Expert)
 * mapped by level number via `tierForLevel(level)`:
 *   Levels 1–3   → tier 0 (Starter)
 *   Levels 4–6   → tier 1 (Getting Tricky)
 *   Levels 7+    → tier 2 (Expert)
 *
 * Within a tier, a word is picked at random each level.
 * This means two players at the same difficulty + level may get different
 * words, keeping the game fresh on repeated playthroughs.
 *
 * Word length ranges per difficulty:
 *   Easy    → 3–4 letters  (CAT, BALL)
 *   Medium  → 5–6 letters  (SHARK, CASTLE)
 *   Hard    → 7–8 letters  (VOLCANO, EXPLORER)
 *   Extreme → 9+ letters   (EARTHQUAKE, TRAMPOLINE)
 *
 * ── Free-play categories (WORD_CATEGORIES) ───────────────────────────────
 * 8 categories: Animals, Food, Space, Colors & Fun, Nature, Sports,
 *               Vehicles, Occupations.
 * Each category has ~13–15 words spanning a wide length range so kids of
 * all skill levels can play without feeling locked to a difficulty setting.
 *
 * ── compact builder ──────────────────────────────────────────────────────
 * `const w = (word, hint, emoji, category) => ({ word, hint, emoji, category })`
 * is used for every word entry in this file to keep each line short and
 * scannable.  Without it each entry would be a 4-property object literal
 * spanning 4–5 lines, making the 1306-line file much harder to navigate.
 *
 * ── Export summary ───────────────────────────────────────────────────────
 *   MAX_WRONG                    — number of wrong guesses that ends the game (6)
 *   WORD_CATEGORIES              — free-play category array
 *   DIFFICULTIES                 — difficulty metadata array
 *   EASY_TIERS / MEDIUM_TIERS / HARD_TIERS / EXTREME_TIERS — tiered word lists
 *   getRandomWord()              — pick a random word from any category
 *   getWordFromCategory(label)   — pick a random word from a named category
 *   getWordByDifficultyAndLevel(difficulty, level) — main game-play word picker
 *   getWordByDifficulty(label)   — shorthand for level 1
 *   getEasyWordByLevel(level)    — Easy-specific picker (kept for legacy callers)
 *   getDifficultyWordCount(label)— total word count for a given difficulty
 *   tierForLevel(level)          — maps a level number to a tier index (0/1/2)
 *   tierLabel(level)             — maps a level number to a human label string
 */

export interface WordEntry {
  word: string;
  hint: string;
  emoji: string;
  category: string;
}

/**
 * Compact word-entry builder.
 * Used for every word in this file to keep each line concise and consistent.
 * Example: w("CAT", "It meows and loves naps", "🐱", "Animals")
 */
const w = (word: string, hint: string, emoji: string, category: string): WordEntry =>
  ({ word, hint, emoji, category });

/* ─── Free-play categories (home screen) ────────────────────────────────── */
export const WORD_CATEGORIES: { label: string; emoji: string; words: WordEntry[] }[] = [
  {
    label: "Animals", emoji: "🐾",
    words: [
      w("CAT","It meows and loves naps","🐱","Animals"),
      w("DOG","Man's best friend","🐶","Animals"),
      w("LION","King of the jungle","🦁","Animals"),
      w("BEAR","Loves honey and hibernation","🐻","Animals"),
      w("DUCK","It quacks!","🦆","Animals"),
      w("FROG","Jumps on lily pads","🐸","Animals"),
      w("FISH","Swims in the sea","🐟","Animals"),
      w("WOLF","Howls at the moon","🐺","Animals"),
      w("ELEPHANT","Biggest land animal with a long trunk","🐘","Animals"),
      w("PENGUIN","A black and white bird that loves cold","🐧","Animals"),
      w("GIRAFFE","Has a very long neck","🦒","Animals"),
      w("MONKEY","Loves bananas and climbing trees","🐒","Animals"),
      w("RABBIT","Hops and has long ears","🐰","Animals"),
      w("DOLPHIN","Smart ocean swimmer","🐬","Animals"),
      w("OCTOPUS","Has eight arms in the ocean","🐙","Animals"),
    ],
  },
  {
    label: "Food", emoji: "🍎",
    words: [
      w("CAKE","Sweet treat with candles on birthdays","🎂","Food"),
      w("PIZZA","Round cheesy dish with toppings","🍕","Food"),
      w("CANDY","Sweet sugary treat","🍬","Food"),
      w("APPLE","A red or green fruit","🍎","Food"),
      w("GRAPE","Small round purple or green fruit","🍇","Food"),
      w("MANGO","Tropical yellow sweet fruit","🥭","Food"),
      w("BREAD","Baked food made from flour","🍞","Food"),
      w("DONUT","Ring-shaped sweet with icing","🍩","Food"),
      w("LEMON","Sour yellow citrus fruit","🍋","Food"),
      w("TACO","Mexican food in a shell","🌮","Food"),
      w("COOKIE","Baked sweet flat snack","🍪","Food"),
      w("BANANA","Yellow curved sweet fruit","🍌","Food"),
      w("BURGER","Bun with a patty inside","🍔","Food"),
      w("WAFFLE","Grid-patterned breakfast treat","🧇","Food"),
      w("WATERMELON","Big green fruit with red inside","🍉","Food"),
    ],
  },
  {
    label: "Space", emoji: "🚀",
    words: [
      w("STAR","Twinkles in the night sky","⭐","Space"),
      w("MOON","Earth's natural satellite","🌙","Space"),
      w("MARS","The red planet","🔴","Space"),
      w("ORBIT","Path around a planet","🔄","Space"),
      w("COMET","Ball of ice with a glowing tail","☄️","Space"),
      w("SATURN","Planet with beautiful rings","🪐","Space"),
      w("ROCKET","Space travel vehicle","🚀","Space"),
      w("GALAXY","Billions of stars together","🌌","Space"),
      w("PLANET","Spherical body orbiting a star","🌍","Space"),
      w("JUPITER","Biggest planet with a red spot","🟠","Space"),
      w("ASTEROID","Rocky object in space","🪨","Space"),
      w("UNIVERSE","Everything that exists","🌠","Space"),
      w("TELESCOPE","Used to see far into space","🔭","Space"),
    ],
  },
  {
    label: "Colors & Fun", emoji: "🌈",
    words: [
      w("RED","Color of fire trucks and apples","🔴","Colors"),
      w("BLUE","Color of the sky and ocean","🔵","Colors"),
      w("GREEN","Color of grass and trees","💚","Colors"),
      w("PURPLE","Mix of red and blue","💜","Colors"),
      w("ORANGE","Color of carrots and sunsets","🟠","Colors"),
      w("YELLOW","Color of the sun and bananas","💛","Colors"),
      w("RAINBOW","Colorful arc after rain","🌈","Colors"),
      w("DRAGON","Mythical creature that breathes fire","🐉","Fantasy"),
      w("UNICORN","Magical horse with a horn","🦄","Fantasy"),
      w("WIZARD","Person with magic powers","🧙","Fantasy"),
    ],
  },
];

/* ─── Difficulty settings ────────────────────────────────────────────────── */
export const DIFFICULTIES = [
  { label: "Easy",    emoji: "🌟", tagline: "3–4 letter words",   minLen: 3,  maxLen: 4  },
  { label: "Medium",  emoji: "⚡", tagline: "5–6 letter words",   minLen: 5,  maxLen: 6  },
  { label: "Hard",    emoji: "🔥", tagline: "7–8 letter words",   minLen: 7,  maxLen: 8  },
  { label: "Extreme", emoji: "💀", tagline: "Any word, no mercy", minLen: 1,  maxLen: 99 },
];

export const MAX_WRONG = 6;

/* ═══════════════════════════════════════════════════════════════════════════
   EASY  —  3–4 letter words
   50 categories, 3 progressive tiers
═══════════════════════════════════════════════════════════════════════════ */
export const EASY_TIERS: { tier: number; words: WordEntry[] }[] = [
  {
    tier: 1, // Starter — very common 3-4 letter words
    words: [
      // Mammals
      w("CAT","It meows and loves naps","🐱","Mammals"), w("DOG","Man's best friend","🐶","Mammals"),
      w("COW","Gives milk on a farm","🐄","Mammals"), w("PIG","Pink farm animal that oinks","🐷","Mammals"),
      w("FOX","Cunning orange animal with a bushy tail","🦊","Mammals"), w("BAT","Flies at night using echolocation","🦇","Mammals"),
      w("APE","Big hairy primate in the jungle","🦍","Mammals"), w("ELK","Large deer of North America","🦌","Mammals"),
      w("RAT","Small furry rodent","🐀","Mammals"), w("PUP","A baby dog","🐶","Mammals"),
      // Birds
      w("OWL","Bird that hoots at night","🦉","Birds"), w("HEN","A female chicken","🐔","Birds"),
      w("JAY","Noisy blue garden bird","🐦","Birds"), w("DOVE","White bird symbol of peace","🕊️","Birds"),
      w("CROW","All-black clever bird","🐦","Birds"), w("SWAN","Beautiful white bird on ponds","🦢","Birds"),
      w("DUCK","It quacks!","🦆","Birds"), w("HAWK","Sharp-eyed hunting bird","🦅","Birds"),
      // Sea Life
      w("COD","Popular white fish in the sea","🐟","Sea Life"), w("EEL","Snake-like fish that can produce electricity","🐍","Sea Life"),
      w("RAY","Flat fish that glides through water","🐟","Sea Life"), w("CRAB","Has claws and walks sideways","🦀","Sea Life"),
      w("CLAM","Shellfish that opens and closes","🐚","Sea Life"), w("BASS","Popular sport fish","🐟","Sea Life"),
      // Insects
      w("ANT","Tiny insect that carries food","🐜","Insects"), w("BEE","Makes honey and has a sting","🐝","Insects"),
      w("FLY","Insect with two wings that buzzes","🪰","Insects"), w("BUG","Small creepy crawly","🐛","Insects"),
      // Farm Animals
      w("RAM","Male sheep with big curly horns","🐏","Farm Animals"), w("EWE","Female sheep","🐑","Farm Animals"),
      w("GOAT","Horned animal that eats almost anything","🐐","Farm Animals"), w("FOAL","Baby horse","🐴","Farm Animals"),
      w("LAMB","Baby sheep","🐑","Farm Animals"),
      // Fruits
      w("FIG","Sweet small fruit with tiny seeds","🍈","Fruits"), w("PLUM","Juicy purple-red fruit","🍇","Fruits"),
      w("PEAR","Teardrop shaped green or yellow fruit","🍐","Fruits"), w("LIME","Sour green citrus fruit","🍋","Fruits"),
      w("KIWI","Fuzzy brown fruit with green inside","🥝","Fruits"),
      // Vegetables
      w("PEA","Tiny round green vegetable in a pod","🫛","Vegetables"), w("CORN","Yellow vegetable on a cob","🌽","Vegetables"),
      w("BEAN","Small pod vegetable","🫘","Vegetables"), w("KALE","Dark leafy green superfood","🥬","Vegetables"),
      w("BEET","Dark red root vegetable","🫚","Vegetables"),
      // Sweets
      w("GUM","Chewy sweet you don't swallow","🍬","Sweets"), w("JAM","Sweet fruity spread on toast","🍓","Sweets"),
      w("PIE","Pastry with sweet or savory filling","🥧","Sweets"), w("CAKE","Sweet treat with candles","🎂","Sweets"),
      w("BUN","Small sweet soft bread","🍞","Sweets"),
      // Drinks
      w("TEA","Hot drink made by steeping leaves","🍵","Drinks"), w("MILK","White drink from cows","🥛","Drinks"),
      w("SODA","Fizzy sweet drink","🥤","Drinks"), w("BEER","Fizzy drink adults enjoy","🍺","Drinks"),
      w("WINE","Drink made from grapes","🍷","Drinks"),
      // Grains
      w("OAT","Grain used to make porridge","🌾","Grains"), w("RYE","Dark grain for bread","🌾","Grains"),
      w("RICE","White grain eaten with many meals","🍚","Grains"),
      // Dairy
      w("BRIE","Soft French cheese with white rind","🧀","Dairy"), w("FETA","Crumbly white Greek cheese","🧀","Dairy"),
      // Meat
      w("HAM","Salty pink meat from a pig","🥩","Meat"), w("BEEF","Meat from a cow","🥩","Meat"),
      w("PORK","Meat from a pig","🥩","Meat"), w("LAMB","Meat from a young sheep","🍖","Meat"),
      // Weather
      w("SUN","The star that warms Earth","☀️","Weather"), w("FOG","Misty cloud near the ground","🌫️","Weather"),
      w("DEW","Tiny water drops on grass at dawn","💧","Weather"), w("ICE","Frozen water","🧊","Weather"),
      w("RAIN","Water falling from clouds","🌧️","Weather"), w("SNOW","White fluffy frozen water","❄️","Weather"),
      // Space
      w("STAR","Twinkles in the night sky","⭐","Space"), w("MOON","Earth's natural satellite","🌙","Space"),
      w("MARS","The red planet","🔴","Space"),
      // Water Bodies
      w("SEA","Huge salty body of water","🌊","Water"), w("BAY","Curved inlet of the sea","🌊","Water"),
      w("LAKE","Large body of fresh water","🏞️","Water"), w("POND","Small still body of water","🌿","Water"),
      // Terrain
      w("MUD","Wet dirty ground","🌿","Terrain"), w("ROCK","Hard natural stone","🪨","Terrain"),
      w("SAND","Tiny grains on the beach","🏖️","Terrain"), w("HILL","Raised area of land","⛰️","Terrain"),
      // Trees
      w("OAK","Strong tree that produces acorns","🌳","Trees"), w("ELM","Tall graceful deciduous tree","🌳","Trees"),
      w("ASH","Tree with distinctive black buds","🌲","Trees"), w("FIR","Evergreen tree that keeps its needles","🌲","Trees"),
      // Flowers
      w("ROSE","Classic flower of love with thorns","🌹","Flowers"), w("LILY","Trumpet-shaped elegant flower","🌸","Flowers"),
      w("IRIS","Purple or blue tall garden flower","💜","Flowers"),
      // Colors
      w("RED","Color of fire trucks and apples","🔴","Colors"), w("TAN","Light brownish-yellow color","🟤","Colors"),
      w("PINK","Light reddish fun color","🩷","Colors"), w("GREY","Color between black and white","🩶","Colors"),
      w("BLUE","Color of sky and ocean","🔵","Colors"),
      // Face
      w("EAR","You hear sound with it","👂","Face"), w("EYE","You use it to see","👁️","Face"),
      w("LIP","The edge of your mouth","😊","Face"), w("JAW","The lower bone of your face","😬","Face"),
      w("NOSE","You breathe and smell with it","👃","Face"),
      // Upper Body
      w("ARM","You use it to throw a ball","💪","Upper Body"), w("RIB","Curved bone protecting your chest","🦴","Upper Body"),
      w("BACK","Opposite side of your chest","🧍","Upper Body"), w("PALM","Flat inner part of your hand","🤚","Upper Body"),
      // Lower Body
      w("LEG","You use it to walk and run","🦵","Lower Body"), w("TOE","Small digit on your foot","🦶","Lower Body"),
      w("HIP","Joint connecting leg to body","🦵","Lower Body"), w("HEEL","Back part of your foot","🦶","Lower Body"),
      w("KNEE","Bends in the middle of your leg","🦵","Lower Body"),
      // Ball Sports
      w("NET","Barrier in many sports","🏸","Ball Sports"), w("BAT","Stick used to hit a ball","🏏","Ball Sports"),
      w("GOLF","Hit a ball into tiny holes","⛳","Ball Sports"), w("POLO","Sport played on horseback","🏇","Ball Sports"),
      // Water Sports
      w("SURF","Ride ocean waves on a board","🏄","Water Sports"), w("SWIM","Move through water","🏊","Water Sports"),
      w("DIVE","Jump headfirst into water","🤽","Water Sports"),
      // Winter Sports
      w("SKI","Glide down snowy slopes","⛷️","Winter Sports"), w("SLED","Slide down hills on runners","🛷","Winter Sports"),
      // Combat Sports
      w("BOX","Fight with padded gloves","🥊","Combat Sports"), w("JAB","Quick straight punch","🥊","Combat Sports"),
      // Athletics
      w("RUN","Move fast on your feet","🏃","Athletics"), w("JOG","Run at a slow pace","🏃","Athletics"),
      w("HOP","Jump on one foot","🐸","Athletics"),
      // Music Instruments
      w("DRUM","Percussion instrument you hit","🥁","Music"), w("HORN","Brass wind instrument","🎺","Music"),
      w("HARP","Tall stringed instrument you pluck","🪕","Music"), w("GONG","Large metal disc you strike","🔔","Music"),
      // Music Terms
      w("NOTE","A single musical sound","🎵","Music"), w("BEAT","The rhythm of music","🎵","Music"),
      w("SONG","A piece of music with words","🎶","Music"), w("TUNE","A pleasant melody","🎵","Music"),
      // Biology
      w("CELL","The basic building block of life","🔬","Biology"), w("GENE","Tiny code that controls your traits","🧬","Biology"),
      w("SEED","From this a plant will grow","🌱","Biology"), w("LEAF","Green flat part of a plant","🍃","Biology"),
      // Chemistry
      w("ACID","Sour chemical that eats through things","⚗️","Chemistry"), w("SALT","White seasoning from the sea","🧂","Chemistry"),
      w("RUST","Reddish-brown coating on old metal","🟤","Chemistry"),
      // Physics
      w("ATOM","Tiniest particle of matter","⚛️","Physics"), w("VOLT","Unit of electrical force","⚡","Physics"),
      w("WAVE","Up and down movement of energy","🌊","Physics"), w("HEAT","Energy from warmth","🔥","Physics"),
      // Technology
      w("CHIP","Tiny brain inside computers","💻","Technology"), w("DATA","Information stored on a computer","💾","Technology"),
      w("CODE","Instructions a computer follows","💻","Technology"), w("ICON","Small picture on a screen","📱","Technology"),
      w("FILE","Document stored on a computer","📄","Technology"),
      // Health
      w("PILL","Medicine in a small round tablet","💊","Health"), w("GERM","Tiny bug that makes you sick","🦠","Health"),
      w("ACHE","A dull steady pain","😣","Health"), w("DIET","What you eat to stay healthy","🥗","Health"),
      // Countries
      w("IRAN","Country in the Middle East","🌍","Countries"), w("IRAQ","Country on the Tigris River","🌍","Countries"),
      w("OMAN","Desert kingdom on the Arabian Sea","🏜️","Countries"), w("PERU","Home of the Inca Empire","🦙","Countries"),
      w("FIJI","Tropical island nation in the Pacific","🌴","Countries"),
      // Cities
      w("ROME","Ancient city with the Colosseum","🏛️","Cities"), w("OSLO","Capital of Norway","❄️","Cities"),
      w("LIMA","Capital of Peru","🦙","Cities"), w("DOHA","Capital of Qatar","🏙️","Cities"),
      // Landforms
      w("CAPE","Headland jutting into the sea","🏖️","Landforms"), w("ISLE","A small island","🏝️","Landforms"),
      w("REEF","Underwater rocky ridge","🪸","Landforms"), w("MESA","Flat-topped hill with steep sides","🏜️","Landforms"),
      // History
      w("KING","Male ruler of a kingdom","👑","History"), w("LORD","A nobleman of high rank","👑","History"),
      w("ROME","Powerful ancient city and empire","🏛️","History"),
      // Fantasy
      w("MAGE","A powerful magic user","🧙","Fantasy"), w("WAND","Stick used to cast spells","✨","Fantasy"),
      w("ZEUS","King of the Greek gods","⚡","Fantasy"), w("THOR","Norse god of thunder","⚡","Fantasy"),
      // Fantasy Creatures
      w("ELF","Graceful magical forest creature","🧝","Creatures"), w("ORC","Green warrior creature of darkness","👹","Creatures"),
      w("IMP","Small mischievous devil","😈","Creatures"),
      // Jobs
      w("VET","Doctor who treats animals","🐾","Jobs"), w("DOC","Short for doctor","🩺","Jobs"),
      w("COP","Police officer","👮","Jobs"), w("COOK","Person who prepares food","👨‍🍳","Jobs"),
      w("CHEF","Professional cook in a restaurant","👨‍🍳","Jobs"),
      // Land Vehicles
      w("CAR","Four wheels, drives on roads","🚗","Land Vehicles"), w("BUS","Big vehicle carrying many people","🚌","Land Vehicles"),
      w("VAN","Larger version of a car","🚐","Land Vehicles"), w("BIKE","Two wheels you pedal","🚴","Land Vehicles"),
      w("TRAM","Electric vehicle on city rails","🚃","Land Vehicles"),
      // Air & Sea
      w("JET","Very fast aircraft","✈️","Air & Sea"), w("BOAT","Floats on water","🚤","Air & Sea"),
      w("RAFT","Flat floating platform","🛶","Air & Sea"),
      // Clothing
      w("CAP","Soft hat with a brim at front","🧢","Clothing"), w("HAT","Head covering","👒","Clothing"),
      w("BOOT","Sturdy shoe covering the ankle","👢","Clothing"), w("COAT","Warm outer garment","🧥","Clothing"),
      w("SOCK","Soft covering for your foot","🧦","Clothing"),
      // Home
      w("BED","Furniture you sleep on","🛏️","Home"), w("CUP","Container you drink from","☕","Home"),
      w("RUG","Floor covering made from fabric","🏠","Home"), w("LAMP","Device that gives light","💡","Home"),
      w("DOOR","Opens to let you in or out","🚪","Home"),
    ],
  },
  {
    tier: 2, // Getting Tricky — less common 3-4 letter words
    words: [
      // Mammals
      w("YAK","Hairy mountain ox","🐃","Mammals"), w("GNU","African wildebeest","🦬","Mammals"),
      w("EWE","Female sheep","🐑","Mammals"), w("HOG","Wild or domestic pig","🐷","Mammals"),
      w("DOE","Female deer","🦌","Mammals"), w("BEAR","Large mammal that loves honey","🐻","Mammals"),
      w("DEER","Graceful animal with antlers","🦌","Mammals"), w("WOLF","Howls at the moon","🐺","Mammals"),
      w("LION","King of the jungle","🦁","Mammals"), w("HARE","Runs very fast, like a big rabbit","🐇","Mammals"),
      w("BULL","Male cow with horns","🐂","Mammals"), w("MARE","Female horse","🐴","Mammals"),
      w("MULE","Half donkey, half horse","🫏","Mammals"), w("VOLE","Tiny furry field creature","🐭","Mammals"),
      w("MINK","Small furry swimmer","🦦","Mammals"), w("MOLE","Digs tunnels underground","🐭","Mammals"),
      w("PONY","Small friendly horse","🐴","Mammals"), w("COLT","Young male horse","🐴","Mammals"),
      // Birds
      w("WREN","Tiny singing forest bird","🐦","Birds"), w("TEAL","Blue-green dabbling duck","🦆","Birds"),
      w("KITE","Graceful soaring bird of prey","🦅","Birds"), w("IBIS","Long-beaked wading bird","🦩","Birds"),
      w("LARK","Bird famous for its dawn song","🐦","Birds"), w("TERN","Seabird that dives for fish","🦅","Birds"),
      w("ERNE","White-tailed sea eagle","🦅","Birds"), w("ROOK","Chess piece and clever black bird","🐦","Birds"),
      w("SWAN","Elegant white bird on rivers","🦢","Birds"), w("DOVE","Symbol of peace and love","🕊️","Birds"),
      w("COOT","All-black water bird with white bill","🦆","Birds"),
      // Sea Life
      w("KOI","Colorful ornamental pond fish","🐟","Sea Life"), w("DAB","Flat fish of the North Sea","🐟","Sea Life"),
      w("TUNA","Large fast ocean fish in tins","🐟","Sea Life"), w("CARP","Common freshwater fish","🐠","Sea Life"),
      w("PIKE","Long sharp-toothed freshwater predator","🐟","Sea Life"), w("SOLE","Flat sea fish","🐟","Sea Life"),
      w("DACE","Small silver river fish","🐟","Sea Life"), w("WHELK","Sea snail with a spiral shell","🐚","Sea Life"),
      // Insects
      w("WASP","Yellow and black stinging insect","🐝","Insects"), w("MOTH","Like a butterfly but loves darkness","🦋","Insects"),
      w("FLEA","Tiny jumping parasite","🦟","Insects"), w("GNAT","Tiny flying insect that bites","🦟","Insects"),
      w("TICK","Blood-sucking outdoor parasite","🕷️","Insects"), w("MITE","Microscopic bug related to spiders","🕷️","Insects"),
      w("WORM","Wiggly creature that lives in soil","🪱","Insects"), w("GRUB","Fat larva of a beetle","🐛","Insects"),
      // Farm Animals
      w("BOAR","Wild male pig of the forest","🐗","Farm Animals"), w("COLT","Young male horse","🐴","Farm Animals"),
      w("SOW","Female pig","🐷","Farm Animals"), w("WETHER","Castrated male sheep","🐑","Farm Animals"),
      // Fruits
      w("DATE","Sweet brown fruit from a palm tree","🌴","Fruits"), w("SLOE","Small dark wild berry","🫐","Fruits"),
      w("GUAVA","Tropical fruit with pink flesh","🍈","Fruits"),
      // Vegetables
      w("LEEK","Long onion-like vegetable","🧅","Vegetables"), w("OKRA","Green sticky pod vegetable","🥦","Vegetables"),
      w("TARO","Purple starchy root vegetable","🍠","Vegetables"), w("YAM","Orange sweet root vegetable","🍠","Vegetables"),
      w("DILL","Feathery herb used on fish","🌿","Spices"),
      // Sweets
      w("TART","Small open pastry with fruit filling","🥧","Sweets"), w("ROLL","Bread roll often filled with sweet","🍞","Sweets"),
      w("MINT","Cool refreshing sweet","🌿","Sweets"),
      // Drinks
      w("ALE","Type of bitter English beer","🍺","Drinks"), w("RUM","Sweet spirit from sugarcane","🥃","Drinks"),
      w("GIN","Clear spirit flavoured with juniper","🥂","Drinks"), w("COLA","Dark sweet fizzy drink","🥤","Drinks"),
      w("MEAD","Ancient honey wine","🍯","Drinks"), w("GROG","Sailor's rum and water mix","🥃","Drinks"),
      // Grains
      w("BRAN","Outer layer of grain, very healthy","🌾","Grains"), w("MALT","Germinated grain used in brewing","🌾","Grains"),
      w("SAGO","Starchy grains from a palm tree","🌾","Grains"),
      // Dairy
      w("CURD","Thickened milk used to make cheese","🧀","Dairy"), w("GHEE","Clarified butter from India","🫙","Dairy"),
      w("WHEY","Liquid left over from making cheese","🥛","Dairy"),
      // Meat
      w("VEAL","Meat from a young calf","🥩","Meat"), w("DUCK","Fatty bird meat","🍖","Meat"),
      w("LARD","Pig fat used in cooking","🫙","Meat"),
      // Spices
      w("SAGE","Grey-green herb used with meats","🌿","Spices"), w("MACE","Spice from nutmeg shell","🌿","Spices"),
      w("DILL","Feathery green herb","🌿","Spices"),
      // Weather
      w("HAIL","Balls of ice falling from clouds","🌨️","Weather"), w("GALE","Very strong wind","💨","Weather"),
      w("MIST","Very light thin fog","🌫️","Weather"), w("HAZE","Blurry misty air","🌫️","Weather"),
      w("GUST","Sudden strong burst of wind","💨","Weather"), w("WIND","Moving air","💨","Weather"),
      w("COLD","Low temperature","🧊","Weather"), w("SMOG","Polluted foggy air in cities","🏭","Weather"),
      // Space
      w("NOVA","Exploding star that briefly shines bright","💥","Space"), w("HALO","Ring of light around a star or moon","✨","Space"),
      w("RING","Saturn's famous feature","🪐","Space"), w("VOID","Empty space between stars","🌑","Space"),
      // Water Bodies
      w("REEF","Underwater ridge of coral","🪸","Water"), w("COVE","Small sheltered bay","🌊","Water"),
      w("GULF","Large sea inlet","🌊","Water"), w("LOCH","Scottish lake","🏞️","Water"),
      w("RILL","A small stream","🏞️","Water"), w("TARN","Small mountain lake","🏞️","Water"),
      w("MERE","Shallow lake or pond","🌿","Water"), w("BECK","Small northern stream","🏞️","Water"),
      // Terrain
      w("DUNE","Hill of sand in the desert","🏜️","Terrain"), w("VALE","A wide grassy valley","🌿","Terrain"),
      w("MOOR","Wild open boggy landscape","🏔️","Terrain"), w("DALE","A valley between hills","🌿","Terrain"),
      w("FELL","High open moorland","⛰️","Terrain"), w("PEAK","The pointed top of a mountain","⛰️","Terrain"),
      w("CLAY","Sticky earth used to make pottery","🏺","Terrain"),
      // Trees
      w("YEW","Ancient evergreen with red berries","🌲","Trees"), w("PINE","Evergreen that keeps its needles","🌲","Trees"),
      w("PALM","Tropical tree with a tuft at top","🌴","Trees"), w("TEAK","Hardwood tree used in furniture","🌳","Trees"),
      w("LIME","Tree with fragrant blossom","🌳","Trees"),
      // Flowers
      w("ALOE","Succulent plant with healing gel","🌿","Flowers"), w("FLAX","Plant with blue flowers and linen fiber","🌾","Flowers"),
      w("REED","Tall grass growing in water","🌾","Flowers"),
      // Colors
      w("GOLD","Shiny yellow precious color","🌟","Colors"), w("ROSE","Pinkish-red color","🌹","Colors"),
      w("NAVY","Very dark blue color","🔵","Colors"), w("JADE","Deep green gemstone color","💚","Colors"),
      w("TEAL","Blue-green color","🩵","Colors"), w("WINE","Dark reddish-purple color","🍷","Colors"),
      w("RUBY","Deep red gemstone color","❤️","Colors"),
      // Face
      w("CHIN","Bottom part of your face","😊","Face"), w("BROW","The ridge above your eye","😮","Face"),
      w("GUMS","Pink tissue around your teeth","🦷","Face"), w("LOBE","The soft lower part of your ear","👂","Face"),
      w("HAIR","Grows on top of your head","💇","Face"), w("SKIN","Outer covering of your body","🧴","Face"),
      // Upper Body
      w("NAPE","Back of the neck","🧍","Upper Body"), w("NAIL","Hard cover on fingertip","💅","Upper Body"),
      w("VEIN","Tube that carries blood","💉","Upper Body"), w("FIST","Clenched hand","✊","Upper Body"),
      // Lower Body
      w("SHIN","Front of your lower leg","🦵","Lower Body"), w("FOOT","Base of your leg you stand on","🦶","Lower Body"),
      w("CALF","Back of your lower leg","🦵","Lower Body"), w("ARCH","Curved part of your foot sole","🦶","Lower Body"),
      w("SOLE","Bottom of your foot","🦶","Lower Body"),
      // Ball Sports
      w("PUCK","Rubber disk used in ice hockey","🏒","Ball Sports"), w("BALL","Round object used in sports","⚽","Ball Sports"),
      w("GOAL","Point scored in football or hockey","⚽","Ball Sports"), w("KICK","Strike with your foot","🦵","Ball Sports"),
      w("SHOT","Attempt to score a point","🎯","Ball Sports"), w("DUNK","Slam a basketball through the hoop","🏀","Ball Sports"),
      // Water Sports
      w("WADE","Walk through shallow water","🌊","Water Sports"), w("RAFT","Float on a flat boat","🛶","Water Sports"),
      w("OARS","Wooden paddles to row a boat","🚣","Water Sports"), w("SAIL","Catch wind to move a boat","⛵","Water Sports"),
      // Winter Sports
      w("LUGE","Slide feet-first on an ice track","🛷","Winter Sports"), w("RINK","Ice surface for skating","⛸️","Winter Sports"),
      // Combat Sports
      w("KICK","Strike with your foot","🦵","Combat Sports"), w("JUDO","Japanese martial art using throws","🥋","Combat Sports"),
      w("BOUT","A single contest or round","🥊","Combat Sports"),
      // Athletics
      w("DASH","A short fast sprint","🏃","Athletics"), w("LEAP","Jump far through the air","🤸","Athletics"),
      w("RACE","A competition to be fastest","🏁","Athletics"), w("TROT","Move faster than a walk","🏃","Athletics"),
      // Music
      w("LUTE","Pear-shaped stringed instrument","🎸","Music"), w("LYRE","Ancient harp-like instrument","🎵","Music"),
      w("FIFE","Small high-pitched flute","🪈","Music"), w("OBOE","Double-reed woodwind instrument","🪈","Music"),
      w("PIPE","Long tube instrument you blow","🪈","Music"), w("BELL","Metal cup that rings when struck","🔔","Music"),
      // Music Terms
      w("REST","A moment of silence in music","🎵","Music"), w("TONE","A musical sound","🎵","Music"),
      w("SOLO","Performance by one person alone","🎤","Music"), w("DUET","Performance by two people","🎶","Music"),
      w("CLEF","Symbol showing pitch in music","🎼","Music"), w("OPUS","A musical work or composition","🎶","Music"),
      // Biology
      w("ROOT","Part of plant that anchors in soil","🌱","Biology"), w("STEM","Main stalk of a plant","🌿","Biology"),
      w("BULB","Round underground plant organ","🌷","Biology"), w("BARK","Outer covering of a tree trunk","🌳","Biology"),
      w("BONE","Hard white structure in your body","🦴","Biology"), w("GERM","Microscopic organism causing disease","🦠","Biology"),
      w("GILL","Organ fish use to breathe water","🐟","Biology"), w("LUNG","Organ you breathe with","🫁","Biology"),
      // Chemistry
      w("BASE","Opposite of acid in chemistry","⚗️","Chemistry"), w("BOND","Chemical link between atoms","⚗️","Chemistry"),
      w("ZINC","Shiny blue-white metallic element","⚗️","Chemistry"), w("IRON","Strong grey metal element","🔩","Chemistry"),
      w("FOAM","Mass of bubbles","🫧","Chemistry"),
      // Physics
      w("LENS","Curved glass bending light","🔍","Physics"), w("FLUX","Continuous change or flow","🌀","Physics"),
      w("SPIN","Rotation around an axis","🌀","Physics"), w("BEAM","Ray of light","🔦","Physics"),
      w("WATT","Unit of power","⚡","Physics"), w("MASS","Amount of matter in an object","⚗️","Physics"),
      // Technology
      w("DISK","Flat circular storage device","💿","Technology"), w("LINK","Connection between web pages","🔗","Technology"),
      w("WIRE","Metal thread carrying electricity","🔌","Technology"), w("PORT","Socket for connecting devices","🔌","Technology"),
      w("PLUG","Connect a device to power","🔌","Technology"), w("SYNC","Updating devices to match each other","📱","Technology"),
      w("BYTE","Unit of computer storage","💾","Technology"),
      // Health
      w("RASH","Red irritated patch of skin","😣","Health"), w("SHOT","Injection of medicine","💉","Health"),
      w("DOSE","Amount of medicine to take","💊","Health"), w("SCAR","Mark left by a healed wound","🩹","Health"),
      w("CYST","Sac of fluid in the body","🩺","Health"),
      // Countries
      w("LAOS","Landlocked Southeast Asian country","🌿","Countries"), w("MALI","West African nation","🌍","Countries"),
      w("CHAD","Central African country","🌍","Countries"), w("CUBA","Caribbean island nation","🌊","Countries"),
      w("TOGO","Small West African coastal nation","🌍","Countries"),
      // Cities
      w("RIGA","Capital of Latvia","🏙️","Cities"), w("BERN","Capital of Switzerland","🏔️","Cities"),
      w("NICE","City on the French Riviera","☀️","Cities"), w("SUVA","Capital of Fiji","🌴","Cities"),
      // Landforms
      w("PEAK","Pointed top of a mountain","⛰️","Landforms"), w("VALE","A wide flat valley","🌿","Landforms"),
      w("MOOR","Open boggy moorland","🏔️","Landforms"), w("DIKE","Embankment holding back water","🌊","Landforms"),
      w("FLAT","Very low level land","🌾","Landforms"),
      // History
      w("DUKE","High-ranking European nobleman","👑","History"), w("EARL","English nobleman rank","👑","History"),
      w("MONK","Religious man in a monastery","🧎","History"), w("POPE","Head of the Catholic Church","⛪","History"),
      w("CZAR","Russian emperor","👑","History"), w("SERF","Medieval peasant tied to the land","⚔️","History"),
      // Fantasy
      w("BARD","Storytelling poet who plays music","🎭","Fantasy"), w("RUNE","Ancient magical symbol","🔮","Fantasy"),
      w("LOKI","Norse trickster god","⚡","Fantasy"), w("HERA","Queen of the Greek gods","👑","Fantasy"),
      w("ODIN","All-father of the Norse gods","⚔️","Fantasy"),
      // Creatures
      w("OGRE","Large ugly fairy-tale monster","👹","Creatures"), w("LICH","Undead sorcerer from fantasy","💀","Creatures"),
      w("FAUN","Half human, half goat from myths","🐐","Creatures"),
      // Jobs
      w("MONK","Person living in a monastery","🧎","Jobs"), w("DEAN","Head of a university faculty","🎓","Jobs"),
      w("MAID","Person who cleans a house","🧹","Jobs"), w("GURU","Expert teacher or spiritual guide","🧘","Jobs"),
      w("NUN","Religious woman in a convent","⛪","Jobs"),
      // Land Vehicles
      w("SLED","Flat runner vehicle for snow","🛷","Land Vehicles"), w("CART","Simple two-wheeled vehicle","🛒","Land Vehicles"),
      w("JEEP","Off-road four-wheel-drive vehicle","🚙","Land Vehicles"), w("TAXI","Car for hire with a driver","🚕","Land Vehicles"),
      // Air & Sea
      w("KITE","Flying object on a string","🪁","Air & Sea"), w("DHOW","Traditional Arab sailing boat","⛵","Air & Sea"),
      w("BRIG","Two-masted sailing ship","⛵","Air & Sea"),
      // Clothing
      w("BRA","Undergarment worn on the chest","👙","Clothing"), w("BELT","Strap worn around the waist","👕","Clothing"),
      w("GOWN","Long elegant dress","👗","Clothing"), w("HOOD","Head covering attached to a coat","🧥","Clothing"),
      w("ROBE","Long loose garment","👘","Clothing"), w("SHOE","Covers and protects your foot","👟","Clothing"),
      w("KILT","Tartan skirt worn in Scotland","🏴󠁧󠁢󠁳󠁣󠁴󠁿","Clothing"), w("VEST","Sleeveless upper garment","👕","Clothing"),
      // Home
      w("MUG","Large cup with a handle","☕","Home"), w("POT","Deep cooking container","🫕","Home"),
      w("BOWL","Rounded dish for food","🥣","Home"), w("SOFA","Comfortable padded seat","🛋️","Home"),
      w("SINK","Basin with taps for washing","🚿","Home"), w("LOCK","Device to keep a door shut","🔒","Home"),
      w("OVEN","Heated box for cooking","🍳","Home"), w("FORK","Utensil with prongs for eating","🍴","Home"),
      w("VASE","Container for flowers","🌹","Home"),
    ],
  },
  {
    tier: 3, // Expert — rare/tricky 3-4 letter words
    words: [
      // Mammals
      w("PUMA","Large wild cat also called a cougar","🐆","Mammals"), w("LYNX","Wild spotted cat of the forest","🐈","Mammals"),
      w("BOAR","Wild hairy pig of the forest","🐗","Mammals"), w("ORYX","Desert antelope with straight horns","🦌","Mammals"),
      // Birds
      w("SMEW","Small diving duck with white crest","🦆","Birds"), w("COOT","All-black waterbird with white bill","🦆","Birds"),
      w("RUFF","Wading bird with frilly neck feathers","🐦","Birds"), w("SKUA","Large aggressive seabird","🦅","Birds"),
      w("DODO","Extinct flightless island bird","🦤","Birds"), w("SHAG","Seabird related to the cormorant","🐦","Birds"),
      // Sea Life
      w("RUDD","Small silver-red freshwater fish","🐟","Sea Life"), w("CHAR","Cold-water fish related to salmon","🐟","Sea Life"),
      w("SPRAT","Small herring-like fish","🐟","Sea Life"), w("WHELK","Sea snail with coiled shell","🐚","Sea Life"),
      // Insects
      w("NIT","Louse egg attached to hair","🦟","Insects"), w("BOT","Parasitic fly larva","🪰","Insects"),
      w("LICE","Plural of louse, tiny parasites","🦟","Insects"),
      // Fruits
      w("SLOE","Small dark wild berry for sloe gin","🫐","Fruits"), w("UGLI","Wrinkled hybrid citrus fruit","🍊","Fruits"),
      // Vegetables
      w("NORI","Dried seaweed used in sushi","🌿","Vegetables"), w("MUNG","Sprouting Asian green bean","🫛","Vegetables"),
      // Spices
      w("MACE","Spice from the nutmeg shell","🌿","Spices"), w("ANISE","Liquorice-flavored seed spice","🌿","Spices"),
      w("CUMIN","Warm earthy seed spice","🌿","Spices"),
      // Weather
      w("SLUSH","Half-melted snow and ice","❄️","Weather"), w("SMOG","Polluted foggy air","🏭","Weather"),
      w("GUST","Sudden strong burst of wind","💨","Weather"),
      // Space
      w("DISK","Flat circular shape of a galaxy","🌌","Space"), w("HALO","Bright ring around a heavenly body","✨","Space"),
      // Water
      w("FJORD","Narrow sea inlet in steep cliffs","⛰️","Water"), w("BECK","Small northern English stream","🏞️","Water"),
      w("WEIR","Small dam across a river","🌊","Water"),
      // Terrain
      w("CRAG","Steep rugged rocky cliff","⛰️","Terrain"), w("GLEN","Narrow mountain valley","🏔️","Terrain"),
      w("KNOB","Rounded rocky hill","⛰️","Terrain"), w("SCUD","Low driving cloud or spray","🌫️","Terrain"),
      w("TARN","Small mountain lake","🏞️","Terrain"),
      // Trees
      w("CORK","Oak tree whose bark makes corks","🌳","Trees"), w("WYCH","Wych elm, a native British tree","🌳","Trees"),
      // Flowers
      w("RUSH","Grass-like plant in wetlands","🌾","Flowers"), w("GORSE","Spiky yellow-flowered shrub","🌻","Flowers"),
      // Colors
      w("AQUA","Bright blue-green color","💧","Colors"), w("ECRU","Very pale beige color","🤍","Colors"),
      w("BUFF","Pale yellow-tan color","🟡","Colors"), w("FAWN","Light yellowish-brown color","🦌","Colors"),
      w("SAGE","Muted greyish-green color","🌿","Colors"), w("RUST","Dark reddish-brown like old metal","🟤","Colors"),
      // Biology
      w("MYCO","Relating to fungi","🍄","Biology"), w("ALGA","Simple plant living in water","🌿","Biology"),
      w("ZONA","Layer or zone in biology","🔬","Biology"),
      // Chemistry
      w("IONS","Atoms with electric charge","⚗️","Chemistry"), w("FLUX","Flow of a substance","🌀","Chemistry"),
      // Physics
      w("GLOW","Emit a steady light","🔦","Physics"), w("PULL","Force toward something","⚡","Physics"),
      w("PUSH","Force away from something","⚡","Physics"), w("LIFT","Upward force on an aircraft wing","✈️","Physics"),
      // Technology
      w("GRID","Network of lines or electricity supply","⚡","Technology"), w("BAUD","Unit of data transmission speed","💻","Technology"),
      w("NODE","Connection point in a network","🌐","Technology"),
      // Health
      w("BALD","Having no hair on the head","🧑‍🦲","Health"), w("SORE","Painful area on the body","😣","Health"),
      w("WART","Small rough growth on skin","🩺","Health"), w("ITCH","Irritating skin sensation","😣","Health"),
      // Countries
      w("TOGO","Small West African nation","🌍","Countries"), w("GUAM","US island territory in Pacific","🌴","Countries"),
      w("LAOS","Buddhist landlocked nation in SE Asia","🌿","Countries"),
      // Cities
      w("GAZA","City in the Middle East","🌍","Cities"), w("GRAZ","Second city of Austria","🏔️","Cities"),
      w("LODZ","Industrial city in Poland","🏭","Cities"),
      // Landforms
      w("ATOL","Ring-shaped coral island","🏝️","Landforms"), w("BUTTE","Isolated flat-topped rock hill","🏜️","Landforms"),
      w("CWMS","Bowl-shaped hollows in mountains","⛰️","Landforms"),
      // History
      w("TROY","Ancient city of the famous siege","🏛️","History"), w("GILD","Medieval trade organisation","⚔️","History"),
      w("FIEF","Land given to a knight in return for service","🏰","History"),
      // Fantasy
      w("FAUN","Half human, half goat woodland deity","🐐","Fantasy"), w("EROS","Greek god of love","❤️","Fantasy"),
      w("BANE","Something causing great harm","💀","Fantasy"),
      // Creatures
      w("GOLEM","Clay giant brought to life by magic","🗿","Creatures"), w("NAGA","Serpent deity from Hindu myth","🐍","Creatures"),
      // Jobs
      w("SEER","Person who can predict the future","🔮","Jobs"), w("PAGE","Young servant in a medieval court","⚔️","Jobs"),
      w("SAGE","A wise and respected person","🧘","Jobs"),
      // Land Vehicles
      w("LIMO","Long luxury car","🚗","Land Vehicles"), w("TRAM","Electric rail vehicle in cities","🚃","Land Vehicles"),
      // Clothing
      w("TUTU","Ballet dancer's short fluffy skirt","🩰","Clothing"), w("SARI","Wrapped garment worn in South Asia","🥻","Clothing"),
      w("VEIL","Thin fabric covering the face","👰","Clothing"), w("CAPE","Short cloak covering shoulders","🦸","Clothing"),
      w("WRAP","Cloth wrapped around the body","🧣","Clothing"), w("LACE","Delicate openwork fabric","🎀","Clothing"),
      w("MASK","Face covering","🎭","Clothing"), w("SUIT","Matching jacket and trousers","👔","Clothing"),
      w("MITT","Baseball glove or thick oven glove","🧤","Clothing"),
      // Home
      w("VENT","Opening that lets air in or out","🏠","Home"), w("HOSE","Flexible tube for water","🚿","Home"),
      w("HOOK","Curved device for hanging things","🪝","Home"), w("WHET","Sharpen a knife","🔪","Home"),
      w("GRATE","Metal grid in a fireplace","🔥","Home"), w("CLOG","Block a drain","🚿","Home"),
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MEDIUM  —  5–6 letter words
═══════════════════════════════════════════════════════════════════════════ */
export const MEDIUM_TIERS: { tier: number; words: WordEntry[] }[] = [
  {
    tier: 1,
    words: [
      // Mammals
      w("TIGER","Striped big cat of the jungle","🐯","Mammals"), w("HORSE","Large animal you can ride","🐴","Mammals"),
      w("MOUSE","Tiny furry animal that loves cheese","🐭","Mammals"), w("SHEEP","Fluffy farm animal that gives wool","🐑","Mammals"),
      w("WHALE","Largest animal on Earth","🐋","Mammals"), w("GIANT","Enormous creature or person","🦣","Mammals"),
      w("PANDA","Black and white bear from China","🐼","Mammals"), w("KOALA","Marsupial that eats eucalyptus","🐨","Mammals"),
      w("LLAMA","Fluffy South American animal","🦙","Mammals"), w("HIPPO","Huge grey semi-aquatic animal","🦛","Mammals"),
      w("CAMEL","Desert animal with humps","🐪","Mammals"), w("MOOSE","Giant deer with huge flat antlers","🫎","Mammals"),
      w("BISON","Massive hairy wild buffalo","🐃","Mammals"), w("OTTER","Furry animal that floats on its back","🦦","Mammals"),
      w("HYENA","African animal with a famous laugh","🐾","Mammals"), w("LEMUR","Big-eyed striped primate of Madagascar","🐒","Mammals"),
      // Birds
      w("EAGLE","Large powerful bird of prey","🦅","Birds"), w("CRANE","Tall graceful wading bird","🦩","Birds"),
      w("STORK","Tall white bird of long migrations","🦩","Birds"), w("RAVEN","Large all-black clever bird","🐦","Birds"),
      w("FINCH","Small colorful songbird","🐦","Birds"), w("ROBIN","Red-breasted garden bird","🐦","Birds"),
      w("HERON","Long-legged fishing bird","🦩","Birds"), w("SNIPE","Long-billed marsh bird","🐦","Birds"),
      w("SWIFT","Very fast swallow-like bird","🐦","Birds"), w("QUAIL","Small round ground-living bird","🐦","Birds"),
      // Sea Life
      w("SHARK","Large fierce fish of the deep","🦈","Sea Life"), w("SQUID","Tentacled sea creature shooting ink","🦑","Sea Life"),
      w("WHALE","Largest mammal in the ocean","🐋","Sea Life"), w("PRAWN","Pink sea creature like a shrimp","🦐","Sea Life"),
      w("TROUT","Freshwater fish popular for fishing","🐟","Sea Life"), w("CORAL","Colourful sea organism forming reefs","🪸","Sea Life"),
      w("PERCH","Common freshwater fish","🐟","Sea Life"), w("BREAM","Common freshwater and sea fish","🐟","Sea Life"),
      w("ROACH","Common freshwater river fish","🐟","Sea Life"),
      // Insects
      w("APHID","Tiny garden pest that sucks plant sap","🐛","Insects"), w("MIDGE","Tiny flying biting insect","🦟","Insects"),
      w("LOCUST","Swarming insect that devours crops","🦗","Insects"), w("MANTIS","Insect that folds its forelegs to pray","🦗","Insects"),
      // Reptiles
      w("GECKO","Small lizard that can walk up walls","🦎","Reptiles"), w("VIPER","Venomous snake that strikes fast","🐍","Reptiles"),
      w("COBRA","Venomous snake that spreads its hood","🐍","Reptiles"), w("SKINK","Smooth-scaled lizard","🦎","Reptiles"),
      w("ADDER","Britain's only venomous snake","🐍","Reptiles"),
      // Farm Animals
      w("GOOSE","Long-necked farm bird that honks","🪿","Farm Animals"), w("LLAMA","South American pack animal","🦙","Farm Animals"),
      w("SWINE","Another word for pig","🐷","Farm Animals"), w("STEER","Young male cattle","🐂","Farm Animals"),
      // Fruits
      w("APPLE","Red or green crunchy fruit","🍎","Fruits"), w("GRAPE","Tiny round fruit in a bunch","🍇","Fruits"),
      w("LEMON","Sour yellow citrus fruit","🍋","Fruits"), w("MANGO","Tropical yellow sweet fruit","🥭","Fruits"),
      w("PEACH","Fuzzy orange-pink sweet fruit","🍑","Fruits"), w("MELON","Large juicy sweet fruit","🍈","Fruits"),
      w("GUAVA","Tropical fruit with pink flesh","🍈","Fruits"), w("PAPAYA","Large tropical orange fruit","🍈","Fruits"),
      w("OLIVE","Small oily fruit in Mediterranean cooking","🫒","Fruits"), w("BERRY","Small round juicy fruit","🫐","Fruits"),
      w("PRUNE","Dried plum","🍇","Fruits"), w("LEMON","Sour yellow citrus","🍋","Fruits"),
      // Vegetables
      w("ONION","Round vegetable that makes you cry","🧅","Vegetables"), w("CARROT","Orange root vegetable rabbits love","🥕","Vegetables"),
      w("CABBAGE","Round leafy vegetable","🥬","Vegetables"), w("SQUASH","Large hard vegetable","🎃","Vegetables"),
      w("RADISH","Small spicy red root vegetable","🌹","Vegetables"), w("SWEDE","Round purple root vegetable","🌾","Vegetables"),
      w("LEEKS","Long onion-like vegetable","🧅","Vegetables"), w("CHARD","Leafy green with coloured stems","🥬","Vegetables"),
      w("CRESS","Peppery sprouting salad green","🌿","Vegetables"),
      // Sweets & Snacks
      w("CANDY","Sweet sugary treat","🍬","Sweets"), w("DONUT","Ring-shaped sweet with icing","🍩","Sweets"),
      w("FUDGE","Very rich soft chocolate sweet","🍫","Sweets"), w("JELLY","Wobbly sweet fruit dessert","🍮","Sweets"),
      w("TOFFEE","Hard chewy brown sweet","🍬","Sweets"), w("WAFER","Very thin crispy biscuit","🍪","Sweets"),
      w("SCONE","Soft baked British teatime treat","🫖","Sweets"), w("CREAM","Thick white dairy topping","🥛","Sweets"),
      w("CHIPS","Thin crispy fried potato slices","🥔","Fast Food"), w("PIZZA","Round cheesy dish with toppings","🍕","Fast Food"),
      w("BAGEL","Ring-shaped boiled-then-baked bread","🥯","Fast Food"), w("SUSHI","Japanese rice rolls with fish","🍣","Fast Food"),
      w("TACO","Mexican shells with fillings","🌮","Fast Food"), w("CURRY","Spicy sauce dish from India","🍛","Fast Food"),
      w("PASTA","Italian food like spaghetti","🍝","Fast Food"), w("TOAST","Bread heated until golden brown","🍞","Fast Food"),
      // Drinks
      w("CIDER","Fizzy apple drink","🍎","Drinks"), w("JUICE","Drink squeezed from fruit","🍊","Drinks"),
      w("SHAKE","Cold blended milk drink","🥛","Drinks"), w("COCOA","Hot chocolate drink","☕","Drinks"),
      w("LATTE","Espresso with lots of steamed milk","☕","Drinks"), w("BRINE","Very salty water","🧂","Drinks"),
      w("SYRUP","Sweet thick liquid","🍯","Drinks"), w("VODKA","Clear strong Russian spirit","🥃","Drinks"),
      w("TODDY","Hot drink with spirit and honey","🍵","Drinks"),
      // Grains
      w("WHEAT","Most common grain for bread","🌾","Grains"), w("BARLEY","Grain used in brewing beer","🍺","Grains"),
      w("OATMEAL","Ground oats for porridge","🌾","Grains"), w("MILLET","Small round grain from Africa","🌾","Grains"),
      // Dairy
      w("CREAM","Thick rich dairy topping","🥛","Dairy"), w("GOUDA","Round Dutch yellow cheese","🧀","Dairy"),
      w("QUARK","Soft fresh German cheese","🧀","Dairy"), w("CHEDDAR","Popular orange-yellow firm cheese","🧀","Dairy"),
      // Meat
      w("STEAK","Thick slice of beef","🥩","Meat"), w("LIVER","Rich organ meat","🥩","Meat"),
      w("SALAMI","Spicy cured sausage","🍕","Meat"), w("BACON","Cured strips of pork","🥓","Meat"),
      w("PRAWN","Small pink sea creature","🦐","Meat"),
      // Spices
      w("BASIL","Aromatic herb used in Italian cooking","🌿","Spices"), w("THYME","Fragrant herb used with meat","🌿","Spices"),
      w("CHIVE","Thin onion-flavoured herb","🌿","Spices"), w("CUMIN","Warm earthy spice from seeds","🌿","Spices"),
      w("ANISE","Sweet liquorice-flavored spice","🌿","Spices"), w("CLOVE","Aromatic dried flower bud","🌿","Spices"),
      // Weather
      w("CLOUD","Fluffy water vapour in the sky","☁️","Weather"), w("STORM","Heavy rain, thunder and strong wind","⛈️","Weather"),
      w("FROST","Thin icy coating on cold mornings","❄️","Weather"), w("SLEET","Rain mixed with snow","🌨️","Weather"),
      w("SUNNY","Bright and warm outside","☀️","Weather"), w("HUMID","Warm and sticky air","💧","Weather"),
      w("WINDY","With a lot of strong wind","💨","Weather"), w("FOGGY","Thick fog reducing visibility","🌫️","Weather"),
      w("DRIZZLE","Very light gentle rain","🌧️","Weather"),
      // Space
      w("COMET","Ball of ice with a glowing tail","☄️","Space"), w("ORBIT","Path a planet takes around the sun","🔄","Space"),
      w("PLUTO","Tiny dwarf planet far from the sun","🌑","Space"), w("VENUS","Hottest planet covered in clouds","⭐","Space"),
      w("TITAN","Saturn's largest moon","🪐","Space"), w("LUNAR","Relating to the moon","🌙","Space"),
      w("NEBULA","Giant colorful cloud of gas in space","🌌","Space"), w("PULSAR","Rapidly spinning neutron star","💫","Space"),
      // Water
      w("OCEAN","Huge salty body of water","🌊","Water"), w("RIVER","Flowing water through the land","🏞️","Water"),
      w("CREEK","Small stream or narrow inlet","🏞️","Water"), w("BROOK","Gentle flowing stream","🏞️","Water"),
      w("DELTA","Where a river splits to meet the sea","🌊","Water"), w("FJORD","Narrow sea inlet between tall cliffs","⛰️","Water"),
      w("MARSH","Wet spongy land near rivers","🌿","Water"), w("LAGOON","Shallow water body near coast","🏝️","Water"),
      // Terrain
      w("STONE","Hard natural rock","🪨","Terrain"), w("EARTH","The soil and ground beneath us","🌍","Terrain"),
      w("CLIFF","Steep rocky wall above the sea","⛰️","Terrain"), w("RIDGE","Long narrow top of a mountain","⛰️","Terrain"),
      w("SLOPE","Slanted surface of a hill","⛰️","Terrain"), w("PLAIN","Flat open expanse of land","🌾","Terrain"),
      w("GORGE","Deep narrow valley with steep walls","🏔️","Terrain"), w("SWAMP","Murky muddy wetland","🌿","Terrain"),
      // Trees
      w("BIRCH","Slender tree with white peeling bark","🌳","Trees"), w("BEECH","Smooth grey-barked woodland tree","🌳","Trees"),
      w("MAPLE","Tree famous for its sugary syrup","🍁","Trees"), w("CEDAR","Fragrant evergreen tree","🌲","Trees"),
      w("WILLOW","Graceful tree with drooping branches","🌳","Trees"), w("APPLE","Tree that bears red or green fruit","🍎","Trees"),
      w("ALDER","Tree that grows near water","🌳","Trees"),
      // Flowers
      w("TULIP","Cup-shaped flower in spring","🌷","Flowers"), w("DAISY","White petals around yellow centre","🌼","Flowers"),
      w("PANSY","Velvet-petalled flower with face pattern","🌸","Flowers"), w("POPPY","Red flower of remembrance","🌺","Flowers"),
      w("LILAC","Purple spring-flowering shrub","💜","Flowers"), w("LOTUS","Sacred water flower","🪷","Flowers"),
      w("ASTER","Star-shaped autumn flower","🌸","Flowers"),
      // Colors
      w("GREEN","Color of grass and trees","💚","Colors"), w("BLACK","Darkest color like night","🖤","Colors"),
      w("WHITE","Lightest color like snow","🤍","Colors"), w("BROWN","Color of chocolate and soil","🟤","Colors"),
      w("CORAL","Pinkish-orange ocean color","🪸","Colors"), w("LILAC","Pale purple color","💜","Colors"),
      w("AMBER","Warm golden-orange color","🟠","Colors"), w("IVORY","Creamy off-white color","🤍","Colors"),
      w("AZURE","Bright sky-blue color","🔵","Colors"), w("MAUVE","Pale muted purple color","💜","Colors"),
      w("OCHRE","Earthy yellow-brown pigment","🟡","Colors"), w("BEIGE","Pale sandy color","🟡","Colors"),
      w("SLATE","Blue-grey color of slate rock","🩶","Colors"), w("TAUPE","Dark brownish-grey color","🟤","Colors"),
      // Face
      w("CHEEK","Round fleshy part of your face","😊","Face"), w("SKULL","Bony shell protecting the brain","💀","Face"),
      w("BROWS","The ridges above your eyes","😮","Face"), w("TEETH","Hard white structures for biting","🦷","Face"),
      // Upper Body
      w("ELBOW","The bendy part of your arm","💪","Upper Body"), w("WRIST","Joint between hand and forearm","⌚","Upper Body"),
      w("THUMB","The short wide finger on your hand","👍","Upper Body"), w("TORSO","The trunk of your body","🧍","Upper Body"),
      w("SPINE","Column of bones down your back","🦴","Upper Body"), w("CHEST","Front of your body between neck and belly","🧍","Upper Body"),
      // Lower Body
      w("ANKLE","Joint connecting foot to leg","🦶","Lower Body"), w("THIGH","The upper part of your leg","🦵","Lower Body"),
      w("TIBIA","Main lower leg bone","🦴","Lower Body"), w("GROIN","Area at the top of your leg","🦵","Lower Body"),
      // Ball Sports
      w("RUGBY","Sport with an oval ball and tries","🏉","Ball Sports"), w("TENNIS","Racket sport over a net","🎾","Ball Sports"),
      w("HOCKEY","Sport with a stick and puck on ice","🏒","Ball Sports"), w("SQUASH","Racket sport in an enclosed court","🎾","Ball Sports"),
      w("SOCCER","Most popular sport in the world","⚽","Ball Sports"), w("NETBALL","Team sport throwing a ball into a hoop","🏀","Ball Sports"),
      // Water Sports
      w("KAYAK","Narrow boat you paddle sitting down","🛶","Water Sports"), w("CANOE","Open paddle boat","🛶","Water Sports"),
      w("SCUBA","Breathing underwater with a tank","🤿","Water Sports"), w("YACHT","Elegant sailing boat","⛵","Water Sports"),
      // Winter Sports
      w("SKATE","Glide on ice with blades on feet","⛸️","Winter Sports"), w("LUGE","Slide feet-first on an ice track","🛷","Winter Sports"),
      w("SLALOM","Skiing through a course of gates","⛷️","Winter Sports"),
      // Combat Sports
      w("KARATE","Japanese martial art using strikes","🥋","Combat Sports"), w("JUDO","Japanese martial art using throws","🥋","Combat Sports"),
      w("FENCING","Sword-fighting sport","⚔️","Combat Sports"), w("BOXING","Fighting with padded gloves","🥊","Combat Sports"),
      // Athletics
      w("RELAY","Team race handing over a baton","🏃","Athletics"), w("HURDLE","Barrier to jump over in a race","🏃","Athletics"),
      w("SPRINT","Running as fast as possible","🏃","Athletics"), w("JAVELIN","Long spear thrown in athletics","🥇","Athletics"),
      // Music
      w("PIANO","Large keyboard instrument","🎹","Music"), w("FLUTE","Long thin instrument you blow across","🪈","Music"),
      w("CELLO","Large bowed string instrument","🎻","Music"), w("BANJO","Five-string American folk instrument","🪕","Music"),
      w("ORGAN","Large keyboard instrument using pipes","🎵","Music"), w("VIOLA","Mid-sized bowed string instrument","🎻","Music"),
      w("SNARE","Small side drum with rattling wires","🥁","Music"), w("BONGO","Pair of small hand-played drums","🥁","Music"),
      // Music Terms
      w("CHORD","Three or more notes played together","🎵","Music"), w("TEMPO","Speed of a piece of music","🎵","Music"),
      w("PITCH","How high or low a sound is","🎵","Music"), w("VOCAL","Relating to singing","🎤","Music"),
      w("VERSE","Section of a song before the chorus","🎶","Music"), w("LYRIC","Words of a song","🎤","Music"),
      w("OPERA","Dramatic musical performance with singing","🎭","Music"),
      // Biology
      w("PLANT","Living thing that makes its own food","🌿","Biology"), w("FUNGI","Kingdom of life including mushrooms","🍄","Biology"),
      w("ALGAE","Simple plant-like things living in water","🌿","Biology"), w("NERVE","Carries signals through your body","🧠","Biology"),
      w("SPORE","Tiny reproductive particle of fungi","🍄","Biology"), w("ORGAN","Body part with a specific function","🫀","Biology"),
      w("VIRUS","Microscopic particle causing disease","🦠","Biology"), w("PETAL","Colorful leaf of a flower","🌸","Biology"),
      w("PORES","Tiny openings in skin","🧴","Biology"), w("GLAND","Organ that makes and releases substances","🩺","Biology"),
      // Chemistry
      w("OXIDE","Compound of oxygen with another element","⚗️","Chemistry"), w("PRISM","Glass shape splitting light into rainbow","🌈","Chemistry"),
      w("RESIN","Sticky substance from trees or synthetics","⚗️","Chemistry"), w("ALLOY","Metal made by mixing two metals","🔩","Chemistry"),
      w("IODINE","Purple element used as antiseptic","⚗️","Chemistry"), w("BORIC","Relating to boron chemistry","⚗️","Chemistry"),
      // Physics
      w("FORCE","Push or pull that changes motion","⚡","Physics"), w("LASER","Intense beam of focused light","🔦","Physics"),
      w("LEVER","Rod pivoting to lift heavy objects","⚙️","Physics"), w("PRISM","Glass bending light into a spectrum","🌈","Physics"),
      w("INERTIA","Resistance to change in motion","⚡","Physics"), w("PULLEY","Wheel and rope lifting system","⚙️","Physics"),
      w("RADAR","Radio detection and ranging system","📡","Technology"),
      // Technology
      w("ROBOT","Machine following programmed instructions","🤖","Technology"), w("LASER","Thin powerful beam of light","🔦","Technology"),
      w("PIXEL","Tiny dot making up a screen image","🖥️","Technology"), w("DRONE","Remote-controlled flying machine","🚁","Technology"),
      w("MODEM","Device connecting computer to internet","📡","Technology"), w("BYTES","Units of computer data storage","💾","Technology"),
      w("CACHE","Storage for quick data retrieval","💻","Technology"), w("PROXY","Intermediary server in computing","🌐","Technology"),
      // Health
      w("FEVER","High body temperature during illness","🤒","Health"), w("PULSE","Heartbeat felt in a vein","❤️","Health"),
      w("NERVE","Cell carrying body signals","🧠","Health"), w("TUMOR","Abnormal mass of tissue","🩺","Health"),
      w("BLOOD","Red liquid circulating in the body","🩸","Health"), w("BRACE","Support for a weak body part","🦽","Health"),
      // Countries
      w("KENYA","African country famous for safaris","🦁","Countries"), w("JAPAN","Island nation of sushi and anime","⛩️","Countries"),
      w("INDIA","Large Asian country of spices","🌶️","Countries"), w("EGYPT","North African land of pyramids","🏛️","Countries"),
      w("SPAIN","European country of flamenco","💃","Countries"), w("CHILE","Long country along South America's coast","🌶️","Countries"),
      w("GHANA","West African country famous for cocoa","🍫","Countries"), w("NEPAL","Mountain country home of Everest","🏔️","Countries"),
      w("CHINA","Most populous country on Earth","🐉","Countries"), w("ITALY","Country famous for pizza and pasta","🍕","Countries"),
      w("BRAZIL","Largest country in South America","🌿","Countries"), w("FRANCE","Country of fine food and the Eiffel Tower","🗼","Countries"),
      // Cities
      w("PARIS","City of the Eiffel Tower","🗼","Cities"), w("TOKYO","Capital of Japan","🗾","Cities"),
      w("CAIRO","Capital of Egypt and city of pyramids","🏛️","Cities"), w("SEOUL","Capital of South Korea","🏙️","Cities"),
      w("DUBAI","Glitzy city in the United Arab Emirates","🏙️","Cities"), w("TUNIS","Capital of Tunisia","🌍","Cities"),
      w("ACCRA","Capital of Ghana","🌍","Cities"), w("LAGOS","Largest city in Nigeria","🌍","Cities"),
      w("NAIROBI","Capital of Kenya","🦁","Cities"),
      // Landforms
      w("RIDGE","Long narrow mountain top","⛰️","Landforms"), w("OASIS","Green water spot in a desert","🌴","Landforms"),
      w("ATOLL","Ring-shaped coral island","🏝️","Landforms"), w("GORGE","Deep narrow carved valley","🏔️","Landforms"),
      w("BLUFF","High steep bank or cliff","⛰️","Landforms"), w("DELTA","Where river meets sea in fan shape","🌊","Landforms"),
      w("STEPPE","Vast treeless flat grassland","🌾","Landforms"), w("TUNDRA","Cold treeless Arctic landscape","❄️","Landforms"),
      // History
      w("TUDOR","Royal dynasty of England 1485-1603","👑","History"), w("ROMAN","Relating to the ancient Rome empire","🏛️","History"),
      w("GREEK","Relating to ancient Greece","🏺","History"), w("AZTEC","Ancient Mexican civilisation","🌞","History"),
      w("VIKING","Norse seafaring warrior","⚔️","History"), w("FEUDAL","Medieval system of lords and serfs","🏰","History"),
      // Fantasy
      w("MAGIC","Power to make impossible things happen","✨","Fantasy"), w("QUEST","Long journey to find something","🗺️","Fantasy"),
      w("WITCH","Magic woman with a broomstick","🧙","Fantasy"), w("FAIRY","Tiny magical creature with wings","🧚","Fantasy"),
      w("GNOME","Earth-dwelling fantasy creature","🍄","Fantasy"), w("PIXIE","Tiny mischievous elf-like creature","🧚","Fantasy"),
      w("SPELL","Magic words that cast a power","🔮","Fantasy"), w("GHOST","Spooky invisible spirit","👻","Fantasy"),
      w("TROLL","Large ugly creature living under bridges","👹","Fantasy"), w("TITAN","Enormous deity or giant in Greek myth","🏛️","Fantasy"),
      w("DRUID","Celtic priest with nature magic","🌿","Fantasy"), w("ROGUE","Sneaky adventurer who picks locks","🗡️","Fantasy"),
      // Creatures
      w("DEMON","Evil supernatural being","😈","Creatures"), w("ANGEL","Heavenly being with wings","👼","Creatures"),
      w("NIXIE","Water fairy from Germanic myth","🌊","Creatures"), w("SATYR","Half man, half goat in Greek myth","🐐","Creatures"),
      // Jobs
      w("NURSE","Person who cares for patients","🩺","Jobs"), w("JUDGE","Person who decides court cases","⚖️","Jobs"),
      w("PILOT","Person who flies an aircraft","✈️","Jobs"), w("MINER","Person who digs for coal or metals","⛏️","Jobs"),
      w("TAILOR","Person who makes and adjusts clothes","👔","Jobs"), w("BAKER","Person who bakes bread and pastries","🥐","Jobs"),
      w("CLERK","Office worker who keeps records","📋","Jobs"), w("GUARD","Person who protects a place","🛡️","Jobs"),
      // Land Vehicles
      w("TRAIN","Long vehicle running on tracks","🚂","Land Vehicles"), w("TRUCK","Large powerful road vehicle","🚚","Land Vehicles"),
      w("TAXI","Car for hire with a driver","🚕","Land Vehicles"), w("BUGGY","Light open four-wheel vehicle","🚗","Land Vehicles"),
      w("SCOOTER","Small two-wheeled motor vehicle","🛵","Land Vehicles"), w("TRACTOR","Powerful farm vehicle","🚜","Land Vehicles"),
      // Air & Sea
      w("PLANE","Fixed-wing aircraft","✈️","Air & Sea"), w("BLIMP","Large airship","🎈","Air & Sea"),
      w("FERRY","Boat taking passengers across water","⛴️","Air & Sea"), w("CANOE","Narrow paddle boat","🛶","Air & Sea"),
      w("YACHT","Elegant sailing vessel","⛵","Air & Sea"),
      // Clothing
      w("JEANS","Denim trousers","👖","Clothing"), w("SKIRT","Garment hanging from the waist","👗","Clothing"),
      w("SHIRT","Cloth top with collar and buttons","👕","Clothing"), w("SCARF","Wrap for the neck","🧣","Clothing"),
      w("GLOVE","Hand covering","🧤","Clothing"), w("APRON","Protective front covering","👗","Clothing"),
      w("CLOAK","Long loose outer garment","🧥","Clothing"), w("SHORTS","Short trousers above the knee","🩳","Clothing"),
      w("BERET","Soft flat round French hat","🇫🇷","Clothing"), w("TIARA","Small decorative crown","👸","Clothing"),
      // Home
      w("CHAIR","Piece of furniture for sitting","🪑","Home"), w("TABLE","Flat surface on legs","🪑","Home"),
      w("SHELF","Board on a wall holding things","📚","Home"), w("STOVE","Cooking appliance with burners","🍳","Home"),
      w("BASIN","Bowl-shaped container for washing","🚿","Home"), w("TOWEL","Cloth for drying yourself","🛁","Home"),
      w("BROOM","Brush on a long handle for sweeping","🧹","Home"), w("FENCE","Barrier around a garden","🏡","Home"),
      w("GRILL","Metal grid for cooking over heat","🔥","Home"), w("COUCH","Comfortable seat for multiple people","🛋️","Home"),
    ],
  },
  {
    tier: 2,
    words: [
      // Mammals
      w("TAPIR","Pig-like animal with a small trunk","🐷","Mammals"), w("OKAPI","Forest animal with zebra-striped legs","🦓","Mammals"),
      w("STOAT","Slim furry hunter related to weasel","🦦","Mammals"), w("CIVET","Spotted cat-like animal of Africa","🐆","Mammals"),
      w("DINGO","Wild dog of Australia","🐕","Mammals"), w("ELAND","Largest antelope in Africa","🦌","Mammals"),
      w("ADDAX","White desert antelope","🦌","Mammals"),
      // Birds
      w("MACAW","Large colourful tropical parrot","🦜","Birds"), w("EGRET","White wading bird with elegant plumes","🦩","Birds"),
      w("PEWIT","Another name for the lapwing bird","🐦","Birds"), w("GROUSE","Plump game bird of the moorlands","🐦","Birds"),
      w("SNIPE","Long-billed wading bird of marshes","🐦","Birds"),
      // Sea Life
      w("PERCH","Freshwater fish with spiny fins","🐟","Sea Life"), w("SPRAT","Small oily fish in the herring family","🐟","Sea Life"),
      w("WHELK","Large edible sea snail","🐚","Sea Life"), w("BLENNY","Small coastal fish living in rock pools","🐟","Sea Life"),
      // Fruits
      w("PAPAYA","Large tropical orange-fleshed fruit","🍈","Fruits"), w("MELON","Juicy large sweet fruit","🍈","Fruits"),
      w("LYCHEE","Sweet white tropical fruit in red shell","🍒","Fruits"), w("GUAVA","Fragrant tropical pink-fleshed fruit","🍈","Fruits"),
      // Vegetables
      w("TURNIP","Round white-purple root vegetable","🌾","Vegetables"), w("CELERY","Green crunchy stalk vegetable","🥬","Vegetables"),
      w("FENNEL","Anise-flavored bulb vegetable","🌿","Vegetables"), w("CHARD","Leafy green with coloured stems","🥬","Vegetables"),
      w("ENDIVE","Bitter leafy salad vegetable","🥬","Vegetables"),
      // Sweets
      w("HALVA","Middle Eastern sweet from sesame","🍬","Sweets"), w("NOUGAT","Chewy sweet with nuts and sugar","🍬","Sweets"),
      w("TOFFEE","Hard chewy brown caramel sweet","🍬","Sweets"), w("SORBET","Frozen fruity non-dairy dessert","🍨","Sweets"),
      w("MOCHI","Japanese sticky rice cake sweet","🍡","Sweets"),
      // Drinks
      w("MOCHA","Coffee mixed with chocolate","☕","Drinks"), w("LAGER","Light pale fizzy beer","🍺","Drinks"),
      w("STOUT","Dark rich creamy beer","🍺","Drinks"), w("BRINE","Very salty water used for pickling","🧂","Drinks"),
      w("KVASS","Fermented Russian bread drink","🍺","Drinks"),
      // Weather
      w("SQUALL","Sudden violent wind and rain","💨","Weather"), w("MUGGY","Hot and damp weather","💧","Weather"),
      w("BALMY","Pleasantly warm and gentle weather","☀️","Weather"), w("BLOWY","Windy and breezy conditions","💨","Weather"),
      w("THICK","Dense and hard to see through (fog)","🌫️","Weather"),
      // Space
      w("QUASAR","Extremely bright ancient cosmic object","✨","Space"), w("TITAN","Saturn's largest and foggy moon","🪐","Space"),
      w("APSIS","Point of closest or farthest orbit","🔄","Space"), w("DRACO","Constellation of the dragon","🐉","Space"),
      // Fantasy
      w("KNIGHT","Armoured warrior on horseback","⚔️","Fantasy"), w("POTION","Magic liquid with special powers","🧪","Fantasy"),
      w("PORTAL","Magical doorway to another world","🌀","Fantasy"), w("CURSE","Wicked magical punishment","😈","Fantasy"),
      w("GOBLIN","Small green mischievous creature","👺","Fantasy"), w("DRAGON","Fire-breathing winged mythical beast","🐉","Fantasy"),
      w("WIZARD","Powerful magic user with a long staff","🧙","Fantasy"),
      // History
      w("SAXON","Germanic tribe that settled in England","⚔️","History"), w("TROJAN","Relating to ancient Troy","🏛️","History"),
      w("FEUDAL","Of the medieval lord-and-serf system","🏰","History"), w("CELT","Ancient people of Britain and Europe","⚔️","History"),
      w("MOGUL","Powerful ruler especially in India","👑","History"),
      // Countries
      w("QATAR","Small rich Gulf state","🏙️","Countries"), w("TONGA","Polynesian island kingdom","🌴","Countries"),
      w("BENIN","West African nation","🌍","Countries"), w("SUDAN","Large northeast African country","🌍","Countries"),
      w("KYRGYZSTAN","Central Asian mountain republic","🏔️","Countries"),
      // Cities
      w("MINSK","Capital of Belarus","🏙️","Cities"), w("RABAT","Capital of Morocco","🌍","Cities"),
      w("SOFIA","Capital of Bulgaria","🏛️","Cities"), w("DHAKA","Densely populated capital of Bangladesh","🌍","Cities"),
      // Landforms
      w("BUTTE","Isolated flat-topped rocky hill","🏜️","Landforms"), w("ISLET","Very small island","🏝️","Landforms"),
      w("SHOAL","Shallow area of water, a sandbank","🏖️","Landforms"),
      // Science - Biology
      w("LYMPH","Fluid in the lymphatic system","🩺","Biology"), w("MYELIN","Fatty sheath around nerve fibres","🧠","Biology"),
      w("CODON","Sequence of three DNA letters","🧬","Biology"),
      // Chemistry
      w("ESTER","Compound from acid and alcohol","⚗️","Chemistry"), w("ALKYL","Hydrocarbon group in chemistry","⚗️","Chemistry"),
      w("IONIC","Relating to ions or ionic bonds","⚗️","Chemistry"),
      // Physics
      w("TORQUE","Rotational force","⚙️","Physics"), w("OPTIC","Relating to light or eyesight","🔍","Physics"),
      w("SONIC","Relating to sound waves","🔊","Physics"),
      // Technology
      w("CLOUD","Remote internet storage system","☁️","Technology"), w("AGILE","Software development methodology","💻","Technology"),
      w("LINUX","Open-source computer operating system","🐧","Technology"),
      // Health
      w("HERNIA","Organ pushing through muscle wall","🩺","Health"), w("COLIC","Severe stomach cramp pain","😣","Health"),
      w("SCURVY","Vitamin C deficiency disease","🍊","Health"), w("PLAQUE","Harmful deposits on teeth or arteries","🦷","Health"),
      // Jobs
      w("PLUMBER","Person who fixes pipes","🔧","Jobs"), w("WELDER","Person who joins metal using heat","🔥","Jobs"),
      w("SAILOR","Person who works on a ship","⚓","Jobs"), w("ARCHER","Person who shoots arrows","🏹","Jobs"),
      w("JESTER","Medieval court entertainer and clown","🎭","Jobs"),
      // Land Vehicles
      w("LORRY","British word for large truck","🚚","Land Vehicles"), w("CABLE","Cable car for steep hills","🚡","Land Vehicles"),
      w("TRIKE","Three-wheeled vehicle","🛺","Land Vehicles"),
      // Clothing
      w("TUNIC","Simple loose-fitting top","👕","Clothing"), w("PARKA","Warm hooded jacket","🧥","Clothing"),
      w("PONCHO","Blanket-like cloak with head hole","🧥","Clothing"), w("SATIN","Smooth shiny fabric","✨","Clothing"),
      w("TWEED","Rough woollen cloth for jackets","🧥","Clothing"), w("DENIM","Sturdy blue cotton fabric","👖","Clothing"),
      // Home
      w("ATTIC","Top floor under the roof","🏠","Home"), w("CELLAR","Underground room for storage","🏠","Home"),
      w("PORCH","Covered entrance to a house","🏠","Home"), w("LINEN","Woven fabric for bedding and towels","🛏️","Home"),
      w("LADLE","Large deep spoon for serving soup","🥄","Home"),
    ],
  },
  {
    tier: 3,
    words: [
      w("QUARTZ","Hard shiny mineral in rocks","💎","Chemistry"), w("CACTUS","Prickly plant that stores water","🌵","Trees"),
      w("FOSSIL","Ancient creature preserved in rock","🦕","Biology"), w("PLASMA","Fourth state of matter like lightning","⚡","Physics"),
      w("PYTHON","Giant snake that squeezes prey","🐍","Reptiles"), w("SPHINX","Ancient Egyptian statue with lion body","🏛️","History"),
      w("VORTEX","Spinning whirlpool of force","🌀","Physics"), w("ZENITH","The very highest point","🏔️","Physics"),
      w("NIMBUS","A dark rain cloud","⛅","Weather"), w("CARBON","Element in all living things","⚗️","Chemistry"),
      w("VECTOR","Quantity with direction and size","📐","Physics"), w("COBALT","Bright blue metallic element","🔵","Chemistry"),
      w("LICHEN","Crusty growth on rocks","🪨","Biology"), w("CIPHER","A secret code or coded message","🔐","Technology"),
      w("MIRAGE","Optical illusion in desert heat","🏜️","Physics"), w("RAPTOR","Bird of prey or meat-eating dinosaur","🦅","Birds"),
      w("GROTTO","A small picturesque cave","⛰️","Terrain"), w("MANTLE","Layer of Earth below the crust","🌍","Biology"),
      w("TURBAN","Head-covering of wound cloth","👳","Clothing"), w("STEPPE","Vast flat treeless grassland","🌾","Landforms"),
      w("BAZAAR","Busy outdoor market in Middle East","🛍️","Cities"), w("TUNDRA","Cold treeless Arctic landscape","❄️","Landforms"),
      w("FACADE","The front face of a building","🏛️","History"), w("HERALD","Official announcer for royalty","📯","History"),
      w("KNAVE","Dishonest person or jack in cards","🃏","History"), w("LEGATE","Ambassador or representative","🤝","History"),
      w("VESTIBULE","Small entrance hall","🏠","Home"), w("PUMICE","Porous volcanic rock used to scrub","🪨","Chemistry"),
      w("GALLEON","Large Spanish sailing warship","⛵","Air & Sea"), w("TREBUCHET","Medieval siege weapon","⚔️","History"),
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HARD  —  7–8 letter words
═══════════════════════════════════════════════════════════════════════════ */
export const HARD_TIERS: { tier: number; words: WordEntry[] }[] = [
  {
    tier: 1,
    words: [
      // Mammals
      w("DOLPHIN","Smart ocean swimmer","🐬","Mammals"), w("GIRAFFE","Has a very long neck","🦒","Mammals"),
      w("PANTHER","Black big cat that hunts at night","🐆","Mammals"), w("GORILLA","Largest and strongest primate","🦍","Mammals"),
      w("CARIBOU","Arctic deer also called reindeer","🦌","Mammals"), w("HAMSTER","Tiny pet that loves running wheels","🐹","Mammals"),
      // Birds
      w("PENGUIN","Black and white bird of Antarctica","🐧","Birds"), w("OSTRICH","World's largest flightless bird","🦤","Birds"),
      w("PEACOCK","Bird with magnificent colourful tail","🦚","Birds"), w("VULTURE","Large bird that feeds on dead animals","🦅","Birds"),
      w("SPARROW","Small common brown garden bird","🐦","Birds"), w("PELICAN","Seabird with huge pouched beak","🦩","Birds"),
      w("SWALLOW","Fast migratory bird with forked tail","🐦","Birds"),
      // Sea Life
      w("OCTOPUS","Has eight arms in the ocean","🐙","Sea Life"), w("LOBSTER","Red sea creature with large claws","🦞","Sea Life"),
      w("STARFISH","Five-armed sea creature","⭐","Sea Life"), w("SEAHORSE","Tiny horse-shaped fish","🐠","Sea Life"),
      w("CUTTLEFISH","Squid-like sea creature","🦑","Sea Life"),
      // Reptiles
      w("MONITOR","Large lizard of Africa and Asia","🦎","Reptiles"), w("BOA CONSTRICTOR","Giant squeezing snake","🐍","Reptiles"),
      w("IGUANA","Large tropical lizard","🦎","Reptiles"), w("TORTOISE","Slow land reptile with heavy shell","🐢","Reptiles"),
      // Insects
      w("FIREFLY","Insect that glows in the dark","✨","Insects"), w("LADYBUG","Spotted red flying beetle","🐞","Insects"),
      w("TERMITE","Social insect that eats wood","🐛","Insects"), w("CRICKET","Jumping insect that makes a chirping sound","🦗","Insects"),
      // Fruits
      w("AVOCADO","Creamy green fruit used in guacamole","🥑","Fruits"), w("APRICOT","Small orange fuzzy stone fruit","🍑","Fruits"),
      w("COCONUT","Tropical fruit with white flesh inside","🥥","Fruits"), w("PASSION","Passion fruit, tropical wrinkled fruit","🌺","Fruits"),
      w("KUMQUAT","Tiny oval citrus fruit eaten whole","🍊","Fruits"),
      // Vegetables
      w("BROCCOLI","Green tree-like vegetable","🥦","Vegetables"), w("PARSNIP","White carrot-like root vegetable","🌾","Vegetables"),
      w("COURGETTE","Long green summer vegetable","🥒","Vegetables"), w("EGGPLANT","Dark purple oval vegetable","🍆","Vegetables"),
      // Sweets
      w("BROWNIE","Rich dense chocolate cake square","🍫","Sweets"), w("CARAMEL","Soft golden sugar sweet","🍬","Sweets"),
      w("MERINGUE","Light crunchy sweet made from egg white","🍮","Sweets"), w("PRALINE","Sweet made from nuts and caramel","🍫","Sweets"),
      w("TOFFEE","Chewy golden boiled sweet","🍬","Sweets"),
      // Drinks
      w("LEMONADE","Sweet fizzy yellow drink","🍋","Drinks"), w("SMOOTHIE","Blended fruit drink","🥤","Drinks"),
      w("ESPRESSO","Strong concentrated coffee","☕","Drinks"), w("ICED TEA","Cold sweet tea with ice","🍵","Drinks"),
      w("GATORADE","Sports energy drink brand","🏃","Drinks"),
      // Weather
      w("RAINBOW","Colorful arc after rain","🌈","Weather"), w("THUNDER","Loud boom after lightning","⛈️","Weather"),
      w("TORNADO","Spinning column of air","🌪️","Weather"), w("DRIZZLE","Very light gentle rain","🌧️","Weather"),
      w("BLIZZARD","Fierce snowstorm with strong winds","❄️","Weather"), w("MONSOON","Season of very heavy rainfall","🌧️","Weather"),
      w("CYCLONE","Tropical storm spinning around centre","🌀","Weather"), w("TYPHOON","Very powerful tropical storm","🌀","Weather"),
      // Space
      w("ASTEROID","Rocky object flying through space","🪨","Space"), w("UNIVERSE","Everything that exists","🌌","Space"),
      w("MOONRISE","When the moon appears at the horizon","🌙","Space"), w("SUNSPOT","Dark area on the sun's surface","☀️","Space"),
      w("ECLIPSE","Blocking of light from sun or moon","🌑","Space"), w("JUPITER","Biggest planet with a red spot","🟠","Space"),
      // Water
      w("ESTUARY","Where a river widens to meet the sea","🌊","Water"), w("RESERVOIR","Man-made lake for water storage","💧","Water"),
      w("TRIBUTARY","River that flows into a larger one","🏞️","Water"), w("TORRENT","Fast rushing stream or flood","🌊","Water"),
      // Terrain
      w("PLATEAU","High flat-topped area of land","⛰️","Terrain"), w("GLACIER","Huge slow-moving river of ice","❄️","Terrain"),
      w("CANYON","Deep river-carved valley","🏜️","Terrain"), w("VOLCANO","Mountain that erupts with lava","🌋","Terrain"),
      w("WETLAND","Boggy area between land and water","🌿","Terrain"),
      // Trees
      w("SEQUOIA","Tallest tree on Earth","🌲","Trees"), w("BAOBAB","African tree storing water in trunk","🌳","Trees"),
      w("SYCAMORE","Large deciduous tree","🌳","Trees"), w("MAHOGANY","Tropical hardwood tree","🌳","Trees"),
      w("CHESTNUT","Tree producing edible nuts in spiky shells","🌰","Trees"),
      // Flowers
      w("JASMINE","Fragrant white or yellow climbing flower","🌸","Flowers"), w("LAVENDER","Purple fragrant herb-flower","💜","Flowers"),
      w("DAFFODIL","Yellow spring trumpet flower","🌼","Flowers"), w("HIBISCUS","Large tropical colourful flower","🌺","Flowers"),
      w("MAGNOLIA","Large white or pink tree flower","🌸","Flowers"), w("MARIGOLD","Bright orange or yellow garden flower","🌻","Flowers"),
      // Colors
      w("CRIMSON","Deep vivid red color","🔴","Colors"), w("MAGENTA","Vivid pinkish-purple color","💜","Colors"),
      w("INDIGO","Deep blue-purple color","🔵","Colors"), w("SCARLET","Bright vivid red color","🔴","Colors"),
      w("EMERALD","Bright vivid green color","💚","Colors"), w("FUCHSIA","Vivid pinkish-red color","🩷","Colors"),
      w("MAROON","Dark brownish-red color","🟤","Colors"), w("SAFFRON","Rich golden-yellow color","🟡","Colors"),
      // Body
      w("STOMACH","Organ that digests food","🫃","Body"), w("EARDRUM","Membrane that vibrates with sound","👂","Body"),
      w("ABDOMEN","The belly area of the body","🧍","Body"), w("FOREARM","Part of arm between elbow and wrist","💪","Body"),
      w("SHINBONE","Front bone of the lower leg","🦴","Body"), w("KNEECAP","Small bone in front of the knee","🦵","Body"),
      // Ball Sports
      w("CRICKET","Sport with bats wickets and balls","🏏","Ball Sports"), w("LACROSSE","Stick-and-ball sport","🥍","Ball Sports"),
      w("HANDBALL","Team sport using hands to score","🤾","Ball Sports"), w("CROQUET","Lawn game hitting balls through hoops","🏑","Ball Sports"),
      // Water Sports
      w("SURFING","Riding ocean waves on a board","🏄","Water Sports"), w("SAILING","Moving a boat using wind in sails","⛵","Water Sports"),
      w("KAYAKING","Paddling in a narrow boat","🛶","Water Sports"), w("SWIMMING","Moving through water with your body","🏊","Water Sports"),
      w("ROWING","Propelling a boat with oars","🚣","Water Sports"),
      // Winter Sports
      w("CURLING","Stone-sliding ice sport with brooms","🥌","Winter Sports"), w("SKATING","Gliding on ice with blades","⛸️","Winter Sports"),
      w("BIATHLON","Skiing and shooting winter sport","🎿","Winter Sports"), w("SNOWBOARD","Snow sport on a single board","🏂","Winter Sports"),
      // Combat Sports
      w("WRESTLING","Sport of grappling and throwing","🤼","Combat Sports"), w("ARCHERY","Shooting arrows at a target","🏹","Combat Sports"),
      w("SUMO","Traditional Japanese heavyweight wrestling","🤼","Combat Sports"),
      // Athletics
      w("MARATHON","26-mile long-distance running race","🏃","Athletics"), w("TRIATHLON","Swimming cycling running combined","🏃","Athletics"),
      w("HIGH JUMP","Jumping over a raised bar","🏃","Athletics"), w("POLE VAULT","Using a pole to jump over a bar","🏅","Athletics"),
      // Music
      w("TRUMPET","Brass wind instrument with valves","🎺","Music"), w("TROMBONE","Sliding brass instrument","🎺","Music"),
      w("CLARINET","Single-reed woodwind instrument","🪈","Music"), w("UKULELE","Small four-string Hawaiian guitar","🪕","Music"),
      w("BASSOON","Low-pitched double-reed instrument","🎵","Music"), w("MANDOLIN","Small eight-string instrument","🪕","Music"),
      // Music Terms
      w("HARMONY","Notes sounding pleasant together","🎵","Music"), w("CADENCE","Sequence of chords ending a phrase","🎵","Music"),
      w("REFRAIN","Repeated chorus in a song","🎶","Music"), w("OVERTURE","Orchestral introduction to an opera","🎭","Music"),
      w("BALLAD","Slow romantic or narrative song","🎵","Music"),
      // Biology
      w("PROTEIN","Large molecule made of amino acids","🔬","Biology"), w("CHLOROPHYLL","Green pigment in plant leaves","🌿","Biology"),
      w("OSMOSIS","Movement of water across a membrane","🔬","Biology"), w("ANTIBODY","Protein fighting infection","🦠","Biology"),
      w("MITOSIS","Cell division producing identical cells","🔬","Biology"),
      // Chemistry
      w("POLYMER","Long chain molecule like plastic","⚗️","Chemistry"), w("CATALYST","Substance speeding up a reaction","⚗️","Chemistry"),
      w("ELEMENT","Pure substance of one type of atom","⚗️","Chemistry"), w("SOLVENT","Liquid that dissolves other substances","⚗️","Chemistry"),
      w("ISOTOPE","Atom with different number of neutrons","⚗️","Chemistry"),
      // Physics
      w("CIRCUIT","Complete path electricity flows through","⚡","Physics"), w("GRAVITY","Force pulling objects toward each other","🌍","Physics"),
      w("DENSITY","Mass per unit of volume","⚗️","Physics"), w("ENTROPY","Measure of disorder in a system","🌀","Physics"),
      w("PHOTON","Particle of light","💡","Physics"),
      // Technology
      w("INTERNET","Global network of connected computers","🌐","Technology"), w("SOFTWARE","Computer programs and applications","💻","Technology"),
      w("DATABASE","Organised collection of data","📊","Technology"), w("BLUETOOTH","Wireless short-range connection","📱","Technology"),
      w("TOUCHSCREEN","Screen responding to touch","📱","Technology"),
      // Health
      w("VACCINE","Substance giving immunity to a disease","💉","Health"), w("SURGERY","Medical procedure cutting the body","🏥","Health"),
      w("VITAMIN","Essential nutrient for body health","💊","Health"), w("MIGRAINE","Severe throbbing headache","🤕","Health"),
      w("PANDEMIC","Disease spreading across many countries","🌍","Health"),
      // Countries
      w("GERMANY","European country famous for cars","🚗","Countries"), w("NIGERIA","Most populous African country","🌍","Countries"),
      w("SWEDEN","Scandinavian country of Vikings","❄️","Countries"), w("URUGUAY","Small South American republic","🌿","Countries"),
      w("VIETNAM","Southeast Asian country famous for food","🍜","Countries"), w("HUNGARY","Central European landlocked country","🏰","Countries"),
      w("MOROCCO","North African kingdom","🏜️","Countries"), w("ECUADOR","Country on the equator in S. America","🌿","Countries"),
      // Cities
      w("ISTANBUL","Historic city straddling Europe and Asia","🏛️","Cities"), w("SHANGHAI","Largest city in China","🌆","Cities"),
      w("TORONTO","Largest city of Canada","🍁","Cities"), w("CHICAGO","Windy city on Lake Michigan","🌬️","Cities"),
      w("BANGKOK","Capital of Thailand","🏛️","Cities"), w("JAKARTA","Capital of Indonesia","🌴","Cities"),
      w("NAIROBI","Capital of Kenya","🦁","Cities"), w("CARACAS","Capital of Venezuela","🌿","Cities"),
      // Landforms
      w("SAVANNA","Tropical grassland with scattered trees","🦁","Landforms"), w("ESTUARY","Wide river mouth meeting the sea","🌊","Landforms"),
      w("CALDERA","Large crater from a collapsed volcano","🌋","Landforms"), w("ALLUVIAL","Relating to river-deposited soil","🌾","Landforms"),
      // History
      w("EMPEROR","Ruler of a huge empire","👑","History"), w("PYRAMID","Ancient triangle-shaped monument","🏛️","History"),
      w("ANCIENT","Very old, from thousands of years ago","🏺","History"), w("MONARCH","King or queen ruling a country","👑","History"),
      w("CHARTER","Official document granting rights","📜","History"), w("CRUSADE","Medieval religious military campaign","⚔️","History"),
      w("DYNASTY","Series of rulers from same family","👑","History"),
      // Fantasy
      w("VAMPIRE","Immortal creature drinking blood","🧛","Fantasy"), w("GRIFFIN","Mythical eagle-head lion-body creature","🦅","Fantasy"),
      w("PEGASUS","Magical winged horse of Greek myth","🐎","Fantasy"), w("CYCLOPS","Giant with one eye","👁️","Fantasy"),
      w("BANSHEE","Irish spirit whose wail means death","👻","Fantasy"), w("WARLOCK","Male witch or wizard","🧙","Fantasy"),
      // Creatures
      w("CENTAUR","Half human, half horse being","🐴","Creatures"), w("UNICORN","Magical horse with a single horn","🦄","Creatures"),
      w("CHIMERA","Mythical beast of lion, goat and serpent","🔥","Creatures"), w("BASILISK","Legendary reptile with lethal gaze","🐍","Creatures"),
      // Jobs
      w("SURGEON","Doctor who performs operations","🔬","Jobs"), w("ADMIRAL","Highest rank naval officer","⚓","Jobs"),
      w("SENATOR","Elected member of a senate","🏛️","Jobs"), w("BARRISTER","Lawyer who argues cases in court","⚖️","Jobs"),
      w("SCULPTOR","Artist who creates three-dimensional art","🗿","Jobs"),
      // Land Vehicles
      w("BICYCLE","Two-wheeled human-powered vehicle","🚲","Land Vehicles"), w("MINIBUS","Small bus for a group","🚐","Land Vehicles"),
      w("CARAVAN","Trailer home pulled by a car","🚙","Land Vehicles"), w("TROLLEY","Electric rail vehicle on streets","🚃","Land Vehicles"),
      // Air & Sea
      w("AIRCRAFT","Any machine that flies","✈️","Air & Sea"), w("FRIGATE","Fast navy warship","⚓","Air & Sea"),
      w("GLIDER","Aircraft with no engine","🪂","Air & Sea"), w("TRAWLER","Fishing boat pulling nets","⛵","Air & Sea"),
      // Clothing
      w("OVERCOAT","Long warm coat worn outdoors","🧥","Clothing"), w("LEGGING","Tight stretchy leg covering","👖","Clothing"),
      w("CARDIGAN","Knitted button-front sweater","🧶","Clothing"), w("SLIPPER","Soft indoor shoe","🥿","Clothing"),
      w("SANDAL","Open summer shoe with straps","🩴","Clothing"),
      // Home
      w("KITCHEN","Room where food is cooked","🍳","Home"), w("BEDROOM","Room where you sleep","🛏️","Home"),
      w("CHIMNEY","Tube above a fireplace for smoke","🏠","Home"), w("WARDROBE","Large cupboard for storing clothes","🧥","Home"),
      w("CABINET","Storage unit with shelves and doors","🪑","Home"),
    ],
  },
  {
    tier: 2,
    words: [
      w("NARWHAL","Arctic whale with a spiral tusk","🐋","Mammals"), w("PIRANHA","Fierce fish with razor teeth","🐟","Sea Life"),
      w("AXOLOTL","Cute salamander that stays juvenile","🦎","Reptiles"), w("MACAQUE","Short-tailed monkey of Asia","🐒","Mammals"),
      w("CAPYBARA","World's largest rodent","🐀","Mammals"), w("PANGOLIN","Scale-covered anteater-like mammal","🦔","Mammals"),
      w("COCKATOO","Large crested parrot from Australia","🦜","Birds"), w("HORNBILL","Bird with large colourful beak","🐦","Birds"),
      w("MANATEE","Gentle sea mammal called a sea cow","🐋","Sea Life"), w("PLATYPUS","Duck-billed egg-laying mammal","🦆","Mammals"),
      w("PORCUPINE","Rodent covered in sharp quills","🦔","Mammals"),
      w("MOLECULE","Smallest unit of a compound","⚗️","Chemistry"), w("NEUTRON","Neutral particle in an atom nucleus","⚛️","Physics"),
      w("ELECTRON","Negative particle orbiting nucleus","⚛️","Physics"), w("SPECTRUM","Range of light wavelengths","🌈","Physics"),
      w("FRACTURE","A crack or break in something","💥","Physics"), w("MOMENTUM","Mass times velocity","⚡","Physics"),
      w("BACTERIA","Microscopic single-celled organisms","🦠","Biology"), w("NITROGEN","Most common gas in atmosphere","⚗️","Chemistry"),
      w("OXIDATION","Adding oxygen or losing hydrogen","⚗️","Chemistry"), w("SEROTONIN","Brain chemical affecting mood","🧠","Biology"),
      w("PANDEMIC","Disease affecting the whole world","🌍","Health"), w("LYMPHOMA","Cancer of the lymphatic system","🩺","Health"),
      w("DIPLOMAT","Official representing their country","🤝","History"), w("FEUDALISM","Medieval system of land for service","🏰","History"),
      w("PAGODA","Tower temple of East Asia","🏛️","History"), w("COLOSSEUM","Famous Roman amphitheatre","🏛️","History"),
      w("GLADIATOR","Roman fighter in public arena","⚔️","History"), w("CRUSADER","Medieval soldier on holy quest","⚔️","History"),
      w("PROPHECY","Prediction of future events","🔮","Fantasy"), w("GUARDIAN","Protector who watches over others","🛡️","Fantasy"),
      w("SORCERER","Powerful wizard casting spells","🧙","Fantasy"), w("SKELETON","Full set of bones inside a body","💀","Fantasy"),
      w("LABYRINTH","Complex maze you can get lost in","🌀","Fantasy"), w("MINOTAUR","Greek bull-headed monster","🐂","Fantasy"),
      w("TWILIGHT","Soft light between sunset and dark","🌆","Nature"), w("EQUINOX","Day when day and night are equal","🌍","Space"),
      w("SOLSTICE","Longest or shortest day of the year","☀️","Space"), w("MONSOON","Season of very heavy rain","🌧️","Weather"),
      w("SAVANNA","Tropical grassland of Africa","🦁","Landforms"), w("TECTONIC","Relating to Earth's moving plates","🌍","Science"),
      w("PHARMACY","Shop where medicines are dispensed","💊","Health"), w("PATHOGEN","Organism causing disease","🦠","Biology"),
      w("SYNDROME","Set of symptoms of a disease","🩺","Health"), w("DEHYDRATED","Lacking sufficient water","💧","Health"),
      w("ALGORITHM","Step-by-step problem-solving method","💻","Technology"), w("BANDWIDTH","Data transmission capacity","📡","Technology"),
      w("DEBUGGING","Finding and fixing code errors","💻","Technology"), w("FIRMWARE","Software embedded in hardware","💻","Technology"),
      w("BROADBAND","High-speed internet connection","🌐","Technology"), w("PROCESSOR","Brain of a computer","💻","Technology"),
    ],
  },
  {
    tier: 3,
    words: [
      w("OBLIVION","State of being completely forgotten","🌑","Fantasy"), w("ETERNITY","Time without any end","♾️","Fantasy"),
      w("INFERNAL","Relating to intense heat or hell","🔥","Fantasy"), w("SPECTRAL","Like a ghost or light spectrum","🌈","Physics"),
      w("ABSTRACT","Existing only as an idea","🎨","Art"), w("MONUMENT","Structure built to remember something","🏛️","History"),
      w("ELEGANCE","Graceful beauty of style","💫","Art"), w("OBSIDIAN","Volcanic glass, sharp black stone","🪨","Chemistry"),
      w("PARCHMENT","Animal skin used as paper in history","📜","History"), w("HERALDRY","System of coats of arms","⚔️","History"),
      w("ALCHEMY","Ancient attempt to turn lead into gold","⚗️","History"), w("APOTHECARY","Historical medicine maker and seller","🧪","History"),
      w("SOVEREIGN","Supreme ruler of a country","👑","History"), w("INQUISITION","Historical religious investigation court","⚔️","History"),
      w("LONGITUDE","East-west position on Earth's map","🌍","Geography"), w("LATITUDE","North-south position on Earth's map","🌍","Geography"),
      w("STRATOSPHERE","Layer of atmosphere above troposphere","🌍","Space"), w("MAGNETISM","Force from magnets attracting iron","🧲","Physics"),
      w("REFRACTION","Bending of light as it passes through glass","🔍","Physics"), w("RADIATION","Energy emitted as waves or particles","⚡","Physics"),
      w("VERTEBRATE","Animal with a backbone","🦴","Biology"), w("CHROMOSOME","Thread of DNA in a cell","🧬","Biology"),
      w("ECOSYSTEM","Community of living things together","🌿","Biology"), w("EVOLUTION","Gradual change in species over time","🦕","Biology"),
      w("SYMBIOSIS","Relationship benefiting both organisms","🌿","Biology"), w("CARNIVORE","Animal that only eats meat","🥩","Biology"),
      w("HERBIVORE","Animal that only eats plants","🌿","Biology"), w("OMNIVORE","Animal that eats plants and meat","🍖","Biology"),
      w("PARLIAMENT","Elected body making laws","🏛️","History"), w("DEMOCRACY","System of government by the people","🗳️","History"),
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   EXTREME  —  8–13 letter words
═══════════════════════════════════════════════════════════════════════════ */
export const EXTREME_TIERS: { tier: number; words: WordEntry[] }[] = [
  {
    tier: 1,
    words: [
      w("ELEPHANT","Biggest land animal with a long trunk","🐘","Mammals"),
      w("BUTTERFLY","Colorful insect that was once a caterpillar","🦋","Insects"),
      w("CROCODILE","Large reptile with huge snapping jaws","🐊","Reptiles"),
      w("CHAMELEON","Lizard that changes skin color to hide","🦎","Reptiles"),
      w("WOLVERINE","Powerful fierce animal like a large weasel","🦡","Mammals"),
      w("FLAMINGO","Pink bird that stands on one leg","🦩","Birds"),
      w("LABRADOR","Friendly large dog breed","🐕","Mammals"),
      w("DINOSAUR","Giant reptile that roamed Earth long ago","🦕","Mammals"),
      w("CATERPILLAR","Fuzzy creature that becomes a butterfly","🐛","Insects"),
      w("RHINOCEROS","Large grey animal with a horn on its nose","🦏","Mammals"),
      w("HIPPOPOTAMUS","Huge grey semi-aquatic African animal","🦛","Mammals"),
      w("CHIMPANZEE","Intelligent African great ape","🐒","Mammals"),
      w("PLATYPUS","Duck-billed egg-laying Australian mammal","🦆","Mammals"),
      w("STEGOSAURUS","Plated back dinosaur","🦕","History"),
      w("CHOCOLATE","Sweet brown treat made from cocoa","🍫","Sweets"),
      w("WATERMELON","Big green fruit with red inside","🍉","Fruits"),
      w("STRAWBERRY","Small red fruit with tiny seeds","🍓","Fruits"),
      w("BLUEBERRY","Tiny round deep-blue sweet berry","🫐","Fruits"),
      w("PINEAPPLE","Tropical spiky fruit with golden flesh","🍍","Fruits"),
      w("AVOCADO","Creamy green fruit for guacamole","🥑","Fruits"),
      w("ASPARAGUS","Long green spring vegetable","🌿","Vegetables"),
      w("COURGETTE","Long green summer squash vegetable","🥒","Vegetables"),
      w("CRANBERRY","Sharp red berry in juice and sauce","🍒","Fruits"),
      w("LEMONADE","Sweet fizzy yellow drink","🍋","Drinks"),
      w("FIREWORKS","Colourful sky explosions for celebrations","🎆","Fun"),
      w("MOONLIGHT","Gentle glow of the moon at night","🌙","Space"),
      w("ADVENTURE","Exciting journey into the unknown","🗺️","Fantasy"),
      w("HALLOWEEN","Spooky holiday on October 31st","🎃","Fun"),
      w("SUPERHERO","Fictional person with amazing powers","🦸","Fantasy"),
      w("TELESCOPE","Used to see far into space","🔭","Space"),
      w("ACCORDION","Squeeze-box musical instrument","🪗","Music"),
      w("TRAMPOLINE","Bouncy mat for jumping high","🤸","Sports"),
      w("SKATEBOARD","Flat board on wheels for tricks","🛹","Sports"),
      w("PARACHUTE","Canopy slowing a fall from the sky","🪂","Sports"),
      w("AVALANCHE","Sudden rush of snow down a mountain","⛰️","Weather"),
      w("HURRICANE","Massive spinning tropical storm","🌀","Weather"),
      w("STALAGMITE","Rock spike rising from cave floor","⛰️","Science"),
      w("RAINFOREST","Dense jungle with very heavy rainfall","🌿","Nature"),
      w("CARIBBEAN","Tropical sea region with many islands","🌴","Geography"),
      w("SATELLITE","Object orbiting Earth transmitting signals","🛸","Technology"),
      w("BINOCULAR","Two-lens device for viewing distant things","🔭","Technology"),
      w("PORCELAIN","Fine white ceramic material for dishes","🫖","Science"),
      w("LABORATORY","Room where scientists do experiments","🔬","Science"),
      w("ASTRONAUT","Person who travels to outer space","👨‍🚀","Space"),
      w("EARTHQUAKE","Ground shaking from tectonic plates","🌍","Science"),
      w("SUPERPOWER","Extraordinary ability like flying","🦸","Fantasy"),
      w("THUNDERBOLT","Flash of lightning hitting the ground","⚡","Weather"),
      w("SKATEBOARD","Flat board on wheels for tricks","🛹","Sports"),
      w("CONIFEROUS","Relating to cone-bearing evergreen trees","🌲","Biology"),
      w("AMPHIBIOUS","Living both in water and on land","🐸","Biology"),
    ],
  },
  {
    tier: 2,
    words: [
      w("CONSTELLATION","Named pattern of stars in the night sky","⭐","Space"),
      w("PHOTOSYNTHESIS","How plants make food using sunlight","🌿","Biology"),
      w("THERMODYNAMICS","Science of heat and energy transfer","🌡️","Science"),
      w("ELECTROMAGNETIC","Combined electric and magnetic force","⚡","Physics"),
      w("KALEIDOSCOPE","Tube of mirrors making colorful patterns","🔮","Fun"),
      w("ENCYCLOPEDIA","Book of knowledge on every topic","📚","School"),
      w("CHAMPIONSHIP","Final contest deciding the top winner","🏆","Sports"),
      w("VACCINATION","Injection protecting you from disease","💉","Health"),
      w("OBSERVATORY","Building with telescope to study space","🔭","Space"),
      w("ELECTRICITY","Energy that powers lights and machines","⚡","Science"),
      w("PHOTOGRAPHY","Taking pictures with a camera","📸","Art"),
      w("UNDERGROUND","Below the surface of the Earth","🚇","Geography"),
      w("ARCHITECTURE","Design and study of buildings","🏛️","Art"),
      w("MASTERPIECE","An artist's greatest and most famous work","🎨","Art"),
      w("ROLLERCOASTER","Fast thrilling fairground ride on rails","🎢","Fun"),
      w("PHILOSOPHER","Thinker asking big questions about life","🤔","History"),
      w("PERSEVERANCE","Continuing to try despite difficulty","💪","Fun"),
      w("MEDITERRANEAN","Warm sea between Europe and Africa","🌊","Geography"),
      w("COMMONWEALTH","Group of nations that work together","🌍","Geography"),
      w("MARKETPLACE","Place where people buy and sell goods","🛍️","Geography"),
      w("AUTOBIOGRAPHY","Book you write about your own life","📖","School"),
      w("SIMULTANEOUSLY","Happening at exactly the same time","⏱️","School"),
      w("HALLUCINATION","Seeing something that is not there","👁️","Health"),
      w("INFRASTRUCTURE","Basic systems like roads, power, water","🏗️","Geography"),
      w("MICROORGANISM","Living thing too tiny to see without microscope","🦠","Biology"),
      w("REVOLUTIONARY","Completely changing how things are done","💥","History"),
      w("EXTRAORDINARY","Far beyond what is normal or expected","🌟","Fun"),
      w("RHINOCEROS","Grey beast with one or two horns","🦏","Mammals"),
      w("HIPPOPOTAMUS","River horse, Africa's huge mammal","🦛","Mammals"),
      w("STEGOSAURUS","Armoured plated dinosaur of Jurassic era","🦕","History"),
      w("TYRANNOSAURUS","The most famous large meat-eating dinosaur","🦖","History"),
      w("DIPLODOCUS","Huge long-necked plant-eating dinosaur","🦕","History"),
      w("BRONTOSAURUS","Enormous sauropod dinosaur","🦕","History"),
      w("VELOCIRAPTOR","Small fast feathered dinosaur","🦕","History"),
      w("PLANETARIUM","Dome building projecting star shows","🌌","Space"),
      w("DISQUALIFIED","Removed from a competition for breaking rules","⚽","Sports"),
    ],
  },
  {
    tier: 3,
    words: [
      w("MALFUNCTIONING","Not working properly or breaking down","💻","Technology"),
      w("UNCONVENTIONAL","Not doing things the normal way","🌀","Fun"),
      w("MISPRONOUNCING","Saying a word incorrectly","🗣️","School"),
      w("SIMULTANEOUSLY","At exactly the same time","⏱️","School"),
      w("PHILANTHROPIST","Person donating money to help others","🤝","History"),
      w("VENTRILOQUIST","Performer making a dummy seem to speak","🎭","Fun"),
      w("IMPERSONATION","Copying how someone looks or acts","🎭","Fun"),
      w("HALLUCINATION","Seeing things that are not really there","👁️","Health"),
      w("IMMUNODEFICIENCY","Immune system not working properly","🦠","Health"),
      w("ELECTROMAGNETISM","Force linking electricity and magnetism","⚡","Physics"),
      w("NEUROPSYCHOLOGY","Study of brain-behavior relationships","🧠","Biology"),
      w("PHOTOSYNTHESIS","Process plants use to make food from sunlight","🌿","Biology"),
      w("PSYCHOLOGICALLY","Relating to the mind and behavior","🧠","Health"),
      w("COUNTERINTUITIVE","Going against common sense","🤔","Fun"),
      w("MISREPRESENTATION","Giving a false picture of something","📺","History"),
      w("BUREAUCRATICALLY","In an overly admin-heavy government style","🏛️","History"),
      w("EXTRATERRESTRIAL","Coming from beyond planet Earth","🛸","Space"),
      w("INTERDISCIPLINARY","Combining several fields of study","📚","School"),
      w("CONSTITUTIONALLY","According to a country's constitution","📜","History"),
      w("SUPERCONDUCTIVITY","Zero electrical resistance at low temperature","⚡","Physics"),
    ],
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function tierForLevel(level: number): number {
  if (level <= 3) return 0;
  if (level <= 6) return 1;
  return 2;
}

/**
 * tierLabel
 * Returns a human-readable label for the current tier within a difficulty.
 * Used in the game screen header to give the player a sense of progression.
 *   Levels 1–3  → "Starter"
 *   Levels 4–6  → "Getting Tricky"
 *   Levels 7+   → "Expert"
 */
export function tierLabel(level: number): string {
  if (level <= 3) return "Starter";
  if (level <= 6) return "Getting Tricky";
  return "Expert";
}

/**
 * pickFromTiers
 * Internal helper — selects a random WordEntry from the correct tier for
 * the given level.  Called by all the difficulty-specific word pickers.
 *
 * `tierForLevel(level)` maps the level to a tier index (0/1/2), then a
 * uniformly random word is chosen from that tier's word list.
 */
function pickFromTiers(
  tiers: { tier: number; words: WordEntry[] }[],
  level: number,
): WordEntry {
  const tier  = tiers[tierForLevel(level)];
  const entry = tier.words[Math.floor(Math.random() * tier.words.length)];
  return entry;
}

/**
 * getRandomWord
 * Returns a random WordEntry from any free-play category.
 * Used by GameContext in free-play mode (difficulty === "").
 * Both the category and the word within it are chosen uniformly at random.
 */
export function getRandomWord(): WordEntry & { category: string } {
  const cat   = WORD_CATEGORIES[Math.floor(Math.random() * WORD_CATEGORIES.length)];
  const entry = cat.words[Math.floor(Math.random() * cat.words.length)];
  return { ...entry, category: cat.label };
}

/**
 * getWordFromCategory
 * Returns a random WordEntry from the named category (e.g. "Animals", "Space").
 * If the label doesn't match any category, falls back to a fully random pick
 * rather than throwing — safe for all callers even if the label is stale.
 */
export function getWordFromCategory(categoryLabel: string): WordEntry & { category: string } {
  const cat   =
    WORD_CATEGORIES.find(c => c.label === categoryLabel) ??
    WORD_CATEGORIES[Math.floor(Math.random() * WORD_CATEGORIES.length)];
  const entry = cat.words[Math.floor(Math.random() * cat.words.length)];
  return { ...entry, category: cat.label };
}

/**
 * getEasyWordByLevel
 * Easy-difficulty-specific picker, kept for any legacy callers.
 * Delegates to `pickFromTiers(EASY_TIERS, level)`.
 */
export function getEasyWordByLevel(level: number): WordEntry & { category: string } {
  const entry = pickFromTiers(EASY_TIERS, level);
  return { ...entry, category: entry.category };
}

/**
 * getWordByDifficultyAndLevel
 * Main word-picker called by GameContext every time a new round starts in
 * difficulty mode.
 *
 * Maps the difficulty string to its tier array and delegates to `pickFromTiers`.
 * Unknown difficulty strings fall back to `getRandomWord()` so a typo never
 * crashes the game — it just silently starts a free-play round.
 */
export function getWordByDifficultyAndLevel(
  difficulty: string,
  level: number,
): WordEntry & { category: string } {
  let entry: WordEntry;
  switch (difficulty) {
    case "Easy":    entry = pickFromTiers(EASY_TIERS,    level); break;
    case "Medium":  entry = pickFromTiers(MEDIUM_TIERS,  level); break;
    case "Hard":    entry = pickFromTiers(HARD_TIERS,    level); break;
    case "Extreme": entry = pickFromTiers(EXTREME_TIERS, level); break;
    default:        return getRandomWord(); // unknown difficulty → free-play fallback
  }
  return { ...entry, category: entry.category };
}

/**
 * getWordByDifficulty
 * Convenience shorthand — always picks a word at level 1.
 * Useful for one-off difficulty samples or testing without tracking a level.
 */
export function getWordByDifficulty(label: string): WordEntry & { category: string } {
  return getWordByDifficultyAndLevel(label, 1);
}

/**
 * TIER_MAP
 * Lookup table mapping a difficulty string to its tier array.
 * Used by `getDifficultyWordCount` to avoid repeating the switch statement.
 */
const TIER_MAP: Record<string, { tier: number; words: WordEntry[] }[]> = {
  Easy: EASY_TIERS, Medium: MEDIUM_TIERS, Hard: HARD_TIERS, Extreme: EXTREME_TIERS,
};

/**
 * getDifficultyWordCount
 * Returns the total number of words across all three tiers for a given
 * difficulty label.  Displayed on the home screen difficulty cards.
 * Returns 0 for unknown difficulty labels (safe, never throws).
 */
export function getDifficultyWordCount(label: string): number {
  const tiers = TIER_MAP[label];
  if (!tiers) return 0;
  // Sum the word count of every tier within this difficulty.
  return tiers.reduce((sum, t) => sum + t.words.length, 0);
}
