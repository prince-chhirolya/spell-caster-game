/*  
  Comments here are a work in progress, 
  check back soon for more :)

  I also have this same code
  in Github where things are broken up
  into more files. 
  
  https://github.com/ste-vg/spell-caster
  
  Right lets do this, we have a lot to 
  cover! Lets get started with...

  _____                            _       
 |_   _|                          | |      
   | |  _ __ ___  _ __   ___  _ __| |_ ___ 
   | | | '_ ` _ \| '_ \ / _ \| '__| __/ __|
  _| |_| | | | | | |_) | (_) | |  | |_\__ \
 |_____|_| |_| |_| .__/ \___/|_|   \__|___/
                 | |                       
                 |_|                       

  GSAP first. We'll use this to do a lot
  of animations. What's nice about GSAP is
  it's happy animating almost anything...
  We'll be animating SVGs, HTML, shaders 
  and 3D objects!
*/

import { gsap } from "https://cdn.skypack.dev/gsap"
import { MotionPathPlugin } from "https://cdn.skypack.dev/gsap/MotionPathPlugin"
import { Flip } from "https://cdn.skypack.dev/gsap/Flip"
gsap.registerPlugin(MotionPathPlugin, Flip)

/*
  We need some simplex noise to help
  with the particle animations. More on
  that later, but for now we'll import
  it and create.
*/

import { createNoise3D } from "https://cdn.skypack.dev/simplex-noise"
const noise3D = createNoise3D()

/*
  We need a lot of Three.js features for 
  this one. We could have just imported 
  everything as just THREE but but I 
  prefer to just grab what I need.
  
  You'll notice I'm just importing these
  from just 'three' rather than the skypack
  url. Thats because I have included an 
  'importmap' to the html <head>. You
  can see that in the settings under HTML.
  
  I could have probably done the same for
  others. 
*/

import {
  AnimationMixer,
  Clock,
  PointLight,
  AmbientLight,
  ColorManagement,
  DirectionalLight,
  Group,
  LinearSRGBColorSpace,
  Mesh,
  PCFSoftShadowMap,
  PerspectiveCamera,
  ReinhardToneMapping,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  Color,
  Raycaster,
  ArrowHelper,
  Box3,
  Box3Helper,
  ConeGeometry,
  DoubleSide,
  MeshBasicMaterial,
  MeshMatcapMaterial,
  Plane,
  Vector2,
  AdditiveBlending,
  BufferAttribute,
  CustomBlending,
  OneFactor,
  Points,
  ZeroFactor,
  AxesHelper,
  BufferGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
  PlaneGeometry,
  Audio,
  AudioListener,
  SphereGeometry,
  LoadingManager,
  TextureLoader,
  AudioLoader,
} from "three"

/*
  Some extra bits we need from Three.js.
*/

import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js"
import { GUI } from "three/addons/libs/lil-gui.module.min.js"
import Stats from "three/addons/libs/stats.module.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader"
import { DRACOLoader } from "three/addons/loaders/DRACOLoader"

/*
  And finally we need to import xState.
  There are a lot of states for the game
  and things can get tricky to manage with 
  just booleans. I love state machines and 
  XState combined with stately.ai makes 
  things so much easier. More on this later...
*/

import { interpret, createMachine } from "https://cdn.skypack.dev/xstate@4.33.6"

/*
  _____       _                 
 |  __ \     | |                
 | |  | | ___| |__  _   _  __ _ 
 | |  | |/ _ \ '_ \| | | |/ _` |
 | |__| |  __/ |_) | |_| | (_| |
 |_____/ \___|_.__/ \__,_|\__, |
                           __/ |
                          |___/ 
                          
  There are a lot of features built just
  to help debugging. I left most of them 
  in so you can turn them on and off here.
  
  Many of these do a great job helping 
  explain how things are working under
  the hood. So have a play!! Playing
  the game with them all set to true
  is hard mode!
  
  (You might be wondering why I stored
  these on window. It's mainly becuase
  I didn't know where I would need these
  settings and what their scope would be. 
  So just to make things simpiler I just 
  plonked them on window. Not something I 
  recommend you do, there are usually
  better ways.)
*/

window.DEBUG = {
  /* 
    Show FPS meter. 
  */
  fps: false,
  /*
    Show current app state
    and available state actions
    as defined in the app-machine
  */
  appState: false,
  /* 
    Show information about the 
    the available spells, the current
    spell being drawn and confidence
    score for each
  */
  casting: false,
  /* 
    Add yellow arrows that show the 
    particle sim flow field, this is 
    a vector grid that applies directional
    and speed influence on each particle
  */
  simFlow: false,
  /* 
    The flow field also has noise
    applied to it. This shows those
    values with red arrows.
  */
  simNoise: false,
  /* 
    Some particles are invisible
    and just there to apply force
    to the flow field. Setting this
    to true renders them as red 
    particles
  */
  forceParticles: false,
  /*
    This shows where the pre-defined
    demon locations are. Also all 
    the paths the can use to enter 
    the room. It's a messy view but
    fun to see!
  */
  locations: false,
  /*
    This adds 2 white spheres for each
    entrance: The door, the trapdoor,
    the right window and the left hole.
    We use 2 points for each to help 
    define the initial angle of the path.
  */
  entrances: false,
  /*
    The exact plae of point lights can
    sometimes be tricky to see, so this
    just adds some spheres to help 
    position things.
  */  
  lights: false,
  /*
    The animation for the demon trails
    as they enter the room happen pretty
    fast so this just renders them as
    solid red while they are in the 
    scene. Useful early on when I was
    debugging their positions.
  */
  trail: false,
  /*
    The sounds can be annoying while 
    developing. So this just has them 
    turned off by default
  */
  disableSounds: false,
  /*
    While the game is paused I enable
    orbit controls, which means the user 
    can move around. Orbit controlls
    normally allow you to move the 
    'look at' point while holding shift
    but that was disabled by my tick
    function. Enabling this stops that
    code in the tick but also breaks some
    of the camera angles. This one is 
    super useful to turn on and get 
    some screenshots. 
  */
  allowLookAtMoveWhenPaused: false,
  /*
    Aligning the HTML elements over 
    the top of the 3D scene can sometimes
    be tricky so this just adds some
    debug outlines to the HTML layout
    elements.
  */
  layoutDebug: false,
}

/*

   _____                _       
  / ____|              | |      
 | |     ___  _ __  ___| |_ ___ 
 | |    / _ \| '_ \/ __| __/ __|
 | |___| (_) | | | \__ \ |_\__ \
  \_____\___/|_| |_|___/\__|___/
  
  We sometimes need to do the same
  operation on all three axes. So
  we can use this array to loop of 
  them rather than writing them 3 times.
*/

const AXIS = ["x", "y", "z"]

/*
  The particle shapes are stored in one 
  image. So this just stores the position 
  of each shape so we can just reference 
  them in a handy name rather than 
  remembering all the numbers.
*/

const PARTICLE_STYLES = {
  invisible: 0,
  smoke: 1,
  plus: 2,
  soft: 3,
  point: 4,
  circle: 5,
  flame: 6,
}

/*
  Putting names in an object like this
  is useful for IDE auto complete and
  helps prevent typos. If you were using 
  Typescript you might have used an Enum
  for this instead.
*/

const SPELLS = {
  arcane: "arcane",
  fire: "fire",
  vortex: "vortex",
}

/*
  We'll talk more about the emitters later
  on but for now just know that there are 
  a few of them but only a few settings 
  change between each. It's useful to store 
  the common settings here and overwrite
  the ones that changed in each instance.
*/

const DEFAULT_EMITTER_SETTINGS = {
  startingPosition: { x: 0.5, y: 0.5, z: 0.5 },
  startingDirection: { x: 0, y: 0, z: 0 },
  emitRate: 0.001,
  particleOrder: [],
  model: null,
  animationDelay: 0,
  lightColor: { r: 1, g: 1, b: 1 },
  group: "magic",
}

/*
  I originally planned to have more enemy
  types, with certain spells only working 
  on certain enemies. I also wanted to have
  this complete for Halloween and it turns 
  out those 2 ideas were not compatible! 
  Anyways, that was a long way to say the
  object isn't all that useful now but it's
  still good practice to store settings 
  like this anyways.
*/

const DEFAULT_ENEMY_SETTINGS = {
  position: { x: 0, y: 0, z: 0 },
  model: null,
  animationDelay: 0,
}

/*
  Like the emitter defaults above the particles
  also share a lot of common settings. This 
  object saves the most common ones and each
  instance overwites the ones it needs to
  change.
*/

const DEFAULT_PARTICLE_SETTINGS = {
  speed: 0.2,
  speedDecay: 0.6,
  speedSpread: 0,
  force: 0.2,
  forceDecay: 0.1,
  forceSpread: 0,
  life: 1,
  lifeDecay: 0.6,
  directionSpread: { x: 0.001, y: 0.001, z: 0.001 },
  positionSpread: { x: 0.01, y: 0.01, z: 0.01 },
  color: { r: 1, g: 1, b: 1 },
  scale: 1,
  scaleSpread: 0,
  style: PARTICLE_STYLES.soft,
  acceleration: 0.1,
}

/*
  I wanted to build this without a framework
  like React. Mainly becuase I think it's good 
  practice to every now and then. So this 
  just grabs and stores some useful DOM elements
  we're going to need later.
*/

const DOM = {
  body: document.body,
  app: document.querySelector(".app"),
  state: document.querySelector(".state"),
  controls: document.querySelector(".controls"),
  canvas: document.querySelector(".canvas"),
  svg: document.querySelector("#spell-helper"),
  demonCount: document.querySelector("[data-demon-count]"),
  spellGuide: document.querySelector("#spell-guide"),
}

/*
  This sounds like the same thing as the 
  DEFAULT_ENEMY_SETTINGS above, I perhaps
  did a bad job naming this, but this is state
  settings for when and how many enemies 
  to send. The reason it's a seperate const
  is beacuse we use this as the reset at
  the start of the game. We can then change
  a few depending on the game mode too.
*/

const ENEMY_SETTINGS = {
  lastSent: 0,
  sendFrequency: 5,
  sendFrequencyReduceBy: 0.2,
  minSendFrequency: 2,
  totalSend: 42,
  sendCount: 0,
  killCount: 0,
}

/*
  These are all the assets the game needs.
  We'll load all of these while showing the 
  loading screen. We define them all here in 
  this handy dandy object. I also define some 
  transforms to the models, their often massive
  or their default position isn't ideal. 
*/

const TO_LOAD = {
  models: [
    { id: "room", file: "https://assets.codepen.io/557388/room.glb", scale: 0.15, position: [0.03, -0.26, -0.55] },
    { id: "demon", file: "https://assets.codepen.io/557388/demon.glb", scale: 0.1, position: [0, 0, 0] },
    { id: "crystal", file: "https://assets.codepen.io/557388/crystal.glb", scale: 0.05, position: [0, 0, 0] },
  ],
  sounds: [
    { id: "music", file: "https://assets.codepen.io/557388/music.mp3" },
    { id: "kill-1", file: "https://assets.codepen.io/557388/kill-1.mp3" },
    { id: "kill-2", file: "https://assets.codepen.io/557388/kill-2.mp3" },
    { id: "kill-3", file: "https://assets.codepen.io/557388/kill-3.mp3" },
    { id: "enter-1", file: "https://assets.codepen.io/557388/enter-1.mp3" },
    { id: "enter-2", file: "https://assets.codepen.io/557388/enter-2.mp3" },
    { id: "error-1", file: "https://assets.codepen.io/557388/error-1.mp3" },
    { id: "cast-1", file: "https://assets.codepen.io/557388/cast-1.mp3" },
    { id: "cast-2", file: "https://assets.codepen.io/557388/cast-2.mp3" },
    { id: "ping-1", file: "https://assets.codepen.io/557388/ping-1.mp3" },
    { id: "ping-2", file: "https://assets.codepen.io/557388/ping-2.mp3" },
    { id: "laugh-1", file: "https://assets.codepen.io/557388/laugh-1.mp3" },
    { id: "laugh-2", file: "https://assets.codepen.io/557388/laugh-2.mp3" },
    { id: "laugh-3", file: "https://assets.codepen.io/557388/laugh-3.mp3" },
    { id: "spell-travel-1", file: "https://assets.codepen.io/557388/spell-travel-1.mp3" },
    { id: "spell-travel-2", file: "https://assets.codepen.io/557388/spell-travel-2.mp3" },
    { id: "spell-travel-3", file: "https://assets.codepen.io/557388/spell-travel-3.mp3" },
    { id: "spell-failed-1", file: "https://assets.codepen.io/557388/spell-failed-1.mp3" },
    { id: "spell-failed-2", file: "https://assets.codepen.io/557388/spell-failed-2.mp3" },
    { id: "trapdoor-close-1", file: "https://assets.codepen.io/557388/trapdoor-close-1.mp3" },
    { id: "trapdoor-close-2", file: "https://assets.codepen.io/557388/trapdoor-close-2.mp3" },
    { id: "torch-1", file: "https://assets.codepen.io/557388/torch-1.mp3" },
    { id: "torch-2", file: "https://assets.codepen.io/557388/torch-2.mp3" },
    { id: "torch-3", file: "https://assets.codepen.io/557388/torch-3.mp3" },
    { id: "crystal-explode", file: "https://assets.codepen.io/557388/crystal-explode.mp3" },
    { id: "crystal-reform", file: "https://assets.codepen.io/557388/crystal-reform.mp3" },
    { id: "glitch", file: "https://assets.codepen.io/557388/glitch.mp3" },
    { id: "portal", file: "https://assets.codepen.io/557388/portal.mp3" },
    { id: "crumble", file: "https://assets.codepen.io/557388/crumble.mp3" },
    { id: "reform", file: "https://assets.codepen.io/557388/reform.mp3" },
  ],
  textures: [
    { id: "magic-particles", file: "https://assets.codepen.io/557388/magic-particles.png" },
    { id: "smoke-particles", file: "https://assets.codepen.io/557388/smoke-particles.png" },
    { id: "spell-arcane", file: "https://assets.codepen.io/557388/spell-arcane.png" },
    { id: "crystal-matcap", file: "https://assets.codepen.io/557388/crystal-matcap.png" },
  ],
}

/*
  There are 2 groups of particles and they
  both work almost identically. The only
  real difference is their blend modes. So
  these are the shared material settings for 
  these. 
*/

const DEFAULT_PARTICLE_MATERIAL_SETTINGS = {
  depthWrite: false,
  vertexColors: true,
  vertexShader: `
uniform float uSize;
uniform float uTime;
uniform bool uGrow;

attribute float scale;
attribute float life;
attribute float type;
attribute vec3 random;

varying vec3 vColor;
varying float vLife;
varying float vType;
varying vec3 vRandom;

void main()
{
    /**
     * Position
     */
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    float spiralRadius = 0.1;
    gl_Position = projectedPosition;

    vColor = color;
    vRandom = random;
    vLife = life;
    vType = type;

    /**
     * Size
     */
    if(uGrow) {
      gl_PointSize = uSize * scale * (2.5 - life);
    }
    else {
      gl_PointSize = uSize * scale * life;
    }
    
    gl_PointSize *= (1.0 / - viewPosition.z);
}
	`,
}

/*
  The particle emmiters need to copy a lot 
  of particle settings around so we use these 
  arrays to help loop through thems.
*/

const PROPERTIES = {
  vec3: ["position", "direction", "random", "color"],
  float: ["type", "speed", "speedDecay", "force", "forceDecay", "acceleration", "life", "lifeDecay", "size"],
}

/*

   _____ _        _                            
  / ____| |      | |                           
 | (___ | |_ __ _| |_ ___                      
  \___ \| __/ _  | __/ _ \                     
  ____) | || (_| | ||  __/                     
 |_____/ \__\__,_|\__\___|   _                 
                      | |   (_)                
  _ __ ___   __ _  ___| |__  _ _ __   ___  ___ 
 |  _   _ \ / _  |/ __|  _ \| |  _ \ / _ \/ __|
 | | | | | | (_| | (__| | | | | | | |  __/\__ \
 |_| |_| |_|\__,_|\___|_| |_|_|_| |_|\___||___/
                                               
  
*/

const AppMachine = createMachine(
  {
    id: "App",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          load: {
            target: "LOADING",
            internal: false,
          },
        },
      },
      LOADING: {
        on: {
          error: {
            target: "LOAD_ERROR",
            internal: false,
          },
          complete: {
            target: "INIT",
            internal: false,
          },
        },
      },
      LOAD_ERROR: {
        on: {
          reload: {
            target: "LOADING",
            internal: false,
          },
        },
      },
      INIT: {
        on: {
          begin: {
            target: "TITLE_SCREEN",
            internal: false,
          },
        },
      },
      TITLE_SCREEN: {
        on: {
          next: {
            target: "INSTRUCTIONS_CRYSTAL",
            internal: false,
          },
          skip: {
            target: "SETUP_GAME",
            internal: false,
          },
          credits: {
            target: "CREDITS",
            internal: false,
          },
          endless: {
            target: "SETUP_ENDLESS",
            internal: false,
          },
          debug: {
            target: "SCENE_DEBUG",
          },
        },
      },
      INSTRUCTIONS_CRYSTAL: {
        on: {
          next: {
            target: "INSTRUCTIONS_DEMON",
            internal: false,
          },
        },
      },
      SETUP_GAME: {
        on: {
          run: {
            target: "GAME_RUNNING",
            internal: false,
          },
        },
      },
      CREDITS: {
        on: {
          close: {
            target: "TITLE_SCREEN",
            internal: false,
          },
          end: {
            target: "TITLE_SCREEN",
          },
        },
      },
      SETUP_ENDLESS: {
        on: {
          run: {
            target: "ENDLESS_MODE",
            internal: false,
          },
        },
      },
      SCENE_DEBUG: {
        on: {
          close: {
            target: "TITLE_SCREEN",
          },
        },
      },
      INSTRUCTIONS_DEMON: {
        on: {
          next: {
            target: "INSTRUCTIONS_CAST",
            internal: false,
          },
        },
      },
      GAME_RUNNING: {
        on: {
          pause: {
            target: "PAUSED",
            internal: false,
          },
          "game-over": {
            target: "GAME_OVER_ANIMATION",
            internal: false,
          },
          spells: {
            target: "SPELL_OVERLAY",
            internal: false,
          },
          win: {
            target: "WIN_ANIMATION",
          },
          special: {
            target: "SPECIAL_SPELL",
          },
        },
      },
      ENDLESS_MODE: {
        on: {
          end: {
            target: "CLEAR_ENDLESS",
            internal: false,
          },
          pause: {
            target: "ENDLESS_PAUSE",
            internal: false,
          },
          spells: {
            target: "ENDLESS_SPELL_OVERLAY",
          },
          special: {
            target: "ENDLESS_SPECIAL_SPELL",
          },
        },
      },
      INSTRUCTIONS_CAST: {
        on: {
          next: {
            target: "INSTRUCTIONS_SPELLS",
            internal: false,
          },
        },
      },
      PAUSED: {
        on: {
          resume: {
            target: "GAME_RUNNING",
            internal: false,
          },
          end: {
            target: "CLEAR_GAME",
          },
        },
      },
      GAME_OVER_ANIMATION: {
        on: {
          end: {
            target: "GAME_OVER",
            internal: false,
          },
        },
      },
      SPELL_OVERLAY: {
        on: {
          close: {
            target: "GAME_RUNNING",
            internal: false,
          },
        },
      },
      WIN_ANIMATION: {
        on: {
          end: {
            target: "WINNER",
          },
        },
      },
      SPECIAL_SPELL: {
        on: {
          complete: {
            target: "GAME_RUNNING",
          },
          win: {
            target: "WIN_ANIMATION",
          },
        },
      },
      CLEAR_ENDLESS: {
        on: {
          end: {
            target: "TITLE_SCREEN",
            internal: false,
          },
        },
      },
      ENDLESS_PAUSE: {
        on: {
          end: {
            target: "CLEAR_ENDLESS",
            internal: false,
          },
          resume: {
            target: "ENDLESS_MODE",
            internal: false,
          },
        },
      },
      ENDLESS_SPELL_OVERLAY: {
        on: {
          close: {
            target: "ENDLESS_MODE",
          },
        },
      },
      ENDLESS_SPECIAL_SPELL: {
        on: {
          complete: {
            target: "ENDLESS_MODE",
          },
        },
      },
      INSTRUCTIONS_SPELLS: {
        on: {
          next: {
            target: "SETUP_GAME",
            internal: false,
          },
        },
      },
      CLEAR_GAME: {
        on: {
          end: {
            target: "TITLE_SCREEN",
            internal: false,
          },
        },
      },
      GAME_OVER: {
        on: {
          restart: {
            target: "SETUP_GAME",
            internal: false,
          },
          instructions: {
            target: "RESETTING_FOR_INSTRUCTIONS",
            internal: false,
          },
          credits: {
            target: "RESETTING_FOR_CREDITS",
            internal: false,
          },
          endless: {
            target: "SETUP_ENDLESS",
            internal: false,
          },
        },
      },
      WINNER: {
        on: {
          restart: {
            target: "SETUP_GAME",
          },
          instructions: {
            target: "INSTRUCTIONS_CRYSTAL",
          },
          credits: {
            target: "CREDITS",
          },
          endless: {
            target: "SETUP_ENDLESS",
          },
        },
      },
      RESETTING_FOR_INSTRUCTIONS: {
        on: {
          run: {
            target: "INSTRUCTIONS_CRYSTAL",
          },
        },
      },
      RESETTING_FOR_CREDITS: {
        on: {
          run: {
            target: "CREDITS",
          },
        },
      },
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  },
  {
    actions: {},
    services: {},
    guards: {},
    delays: {},
  }
)

const CasterMachine = createMachine(
  {
    id: "Caster",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          ready: {
            target: "INACTIVE",
          },
        },
      },
      INACTIVE: {
        on: {
          activate: {
            target: "ACTIVE",
          },
        },
      },
      ACTIVE: {
        on: {
          start_cast: {
            target: "CASTING",
          },
          deactivate: {
            target: "INACTIVE",
          },
        },
      },
      CASTING: {
        on: {
          finished: {
            target: "PROCESSING",
          },
          deactivate: {
            target: "INACTIVE",
          },
        },
      },
      PROCESSING: {
        on: {
          success: {
            target: "SUCCESS",
          },
          fail: {
            target: "FAIL",
          },
          deactivate: {
            target: "INACTIVE",
          },
        },
      },
      SUCCESS: {
        on: {
          complete: {
            target: "ACTIVE",
          },
          deactivate: {
            target: "INACTIVE",
          },
        },
      },
      FAIL: {
        on: {
          complete: {
            target: "ACTIVE",
          },
          deactivate: {
            target: "INACTIVE",
          },
        },
      },
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  },
  {
    actions: {},
    services: {},
    guards: {},
    delays: {},
  }
)

const CrystalMachine = createMachine(
  {
    id: "Crystal",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          start: {
            target: "INIT",
          },
        },
      },
      INIT: {
        on: {
          ready: {
            target: "WHOLE",
          },
        },
      },
      WHOLE: {
        on: {
          overload: {
            target: "OVERLOADING",
          },
        },
      },
      OVERLOADING: {
        on: {
          break: {
            target: "BREAKING",
          },
        },
      },
      BREAKING: {
        on: {
          broke: {
            target: "BROKEN",
          },
        },
      },
      BROKEN: {
        on: {
          fix: {
            target: "FIXING",
          },
        },
      },
      FIXING: {
        on: {
          fixed: {
            target: "WHOLE",
          },
        },
      },
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  },
  {
    actions: {},
    services: {},
    guards: {},
    delays: {},
  }
)

const EnemyMachine = createMachine(
  {
    id: "Enemy",
    initial: "IDLE",
    states: {
      IDLE: {
        on: {
          spawn: {
            target: "ANIMATING_IN",
            internal: false,
          },
        },
      },
      ANIMATING_IN: {
        on: {
          complete: {
            target: "ALIVE",
            internal: false,
          },
          accend: {
            target: "ACCEND",
            internal: false,
          },
        },
      },
      ALIVE: {
        on: {
          incoming: {
            target: "TAGGED",
            internal: false,
          },
          accend: {
            target: "ACCEND",
            internal: false,
          },
          vortex: {
            target: "VORTEX_ANIMATION",
          },
        },
      },
      ACCEND: {
        on: {
          leave: {
            target: "GONE",
            internal: false,
          },
        },
      },
      TAGGED: {
        on: {
          kill: {
            target: "ANIMATING_OUT",
            internal: false,
          },
          accend: {
            target: "ANIMATING_OUT",
          },
        },
      },
      VORTEX_ANIMATION: {
        on: {
          complete: {
            target: "DEAD",
          },
        },
      },
      GONE: {},
      ANIMATING_OUT: {
        on: {
          complete: {
            target: "DEAD",
            internal: false,
          },
        },
      },
      DEAD: {},
    },
    predictableActionArguments: true,
    preserveActionOrder: true,
  },
  {
    actions: {},
    services: {},
    guards: {},
    delays: {},
  }
)

// UTILS

const degToRad = (value) => {
  return (value * Math.PI) / 180
}

const simplelerp = (start, end, amount) => {
  return start + amount * (end - start)
}

const randomFromArray = (arr) => {
  if (!arr || !arr.length) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

// VECTOR UTILS

const lerpVectors = (start, end, amount) => {
  // return {
  //   x: lerp(start.x, end.x, amount),
  //   y: lerp(start.y, end.y, amount),
  //   z: lerp(start.z, end.z, amount),
  // }

  return {
    x: start.x + (end.x - start.x) * amount,
    y: start.y + (end.y - start.y) * amount,
    z: start.z + (end.z - start.z) * amount,
  }
  // return this;
}

const multiplyScalar = (vector, amount) => {
  return {
    x: vector.x * amount,
    y: vector.y * amount,
    z: vector.z * amount,
  }
}

const divideScalar = (vector, amount) => {
  return multiplyScalar(vector, 1 / amount)
}

const add = (a, b) => {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
  }
}

const normalize = (vector) => {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)

  return {
    x: vector.x / length,
    y: vector.y / length,
    z: vector.z / length,
  }
}

const clamp = (vector, min, max) => {
  vector.x = Math.max(min.x, Math.min(max.x, vector.x))
  vector.y = Math.max(min.y, Math.min(max.y, vector.y))
  vector.z = Math.max(min.z, Math.min(max.z, vector.z))

  return vector
}

const length = (vector) => {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z)
}

const clampLength = (vector, min, max) => {
  const l = length(vector)

  const divided = divideScalar(vector, l || 1)
  return multiplyScalar(divided, Math.max(min, Math.min(max, l)))
}

const vector = {
  lerpVectors,
  multiplyScalar,
  divideScalar,
  add,
  normalize,
  clamp,
  length,
  clampLength,
}

const math = {
  degToRad,
}

// EMITTERS

class ControlledEmitter {
  constructor(sim) {
    this.sim = sim
    this.particles = {}
    this.remainingTime = 0
    this.active = false

    this.gsapDefaults = {
      onUpdate: this.update,
      onUpdateProperties: [],
    }
  }

  emit(particle = {}) {
    const newParticle = {
      size: 1,
      color: { r: 1, g: 1, b: 1 },
      position: { z: 0.5, y: 0.35, x: 0.5 },
      life: 0.9,
      style: PARTICLE_STYLES.point,
      ...particle,
      lifeDecay: 0,
      speed: 0,
      speedDecay: 0,
      force: 0,
      forceDecay: 0,
      acceleration: 0,
    }

    const particleIndex = this.sim.createParticle("magic", newParticle)

    this.particles[particleIndex] = {
      index: particleIndex,
      ...newParticle.color,
      ...newParticle.position,
      size: newParticle.size,
      life: newParticle.life,
      lastPosition: null,
      animation: null,
    }

    return this.particles[particleIndex]
  }

  update(particle) {
    const { index, size, life } = particle

    const color = { r: particle.r, g: particle.g, b: particle.b }
    const position = { x: particle.x, y: particle.y, z: particle.z }

    const updates = ["size", "life", "color", "position"]
    const values = { size, life, color, position }

    for (let i = 0; i < updates.length; i++) {
      const update = updates[i]
      this.sim.setParticleProperty("magic", index, update, values[update])
    }

    // this.sim()
  }

  destory(particle) {
    // this.sim
    this.sim.setParticleProperty("magic", particle.index, "life", 0)
    delete this.particles[particle.index]
  }

  release(particle) {
    //this.sim.setParticleProperty("magic", particle.index, "force", 0)
    delete this.particles[index]
    // this.sim
  }
}

class Emitter {
  constructor(sim, emitterSettings, particleTypes, light) {
    this.sim = sim
    this.light = light
    this.active = true
    this.animations = []
    this.settings = { ...DEFAULT_EMITTER_SETTINGS, ...emitterSettings }
    this.delay = this.settings.animationDelay

    if (this.light) {
      gsap.killTweensOf(this.light)
      this.light.color.setRGB(this.settings.lightColor.r, this.settings.lightColor.g, this.settings.lightColor.b)
      this.light.intensity = 3
      // this.animations.push(gsap.to(this.light, { intensity: 5, duration: this.delay }))
    }

    this.particles = { ...particleTypes }

    // particleSettings.forEach((settings) => {
    //   this.particles.push({ ...DEFAULT_PARTICLE_SETTINGS, ...settings })
    // })

    this.position = { ...this.settings.startingPosition }
    // this.previousPosition = { ...this.settings.startingPosition }
    this.direction = { ...this.settings.startingDirection }
    this.remainingTime = 0
    this.destroyed = false
    this.modelScale = 1

    this.count = 0

    this.moveFunction()

    if (this.settings.model) {
      this.model = this.settings.model
      // this.model.group.rotation.y = Math.PI * 0.5
      if (this.model.animations && this.model.animations.length) {
        this.mixer = new AnimationMixer(this.model.scene)
        this.mixer.timeScale = 1.3
        this.mixer.clipAction(this.model.animations[0]).play()
      }
    }
  }

  moveFunction = (delta, elapsedTime) => {
    if (this.model) {
      // this.model.group.scale.set(this.modelScale, this.modelScale, this.modelScale)
    }

    if (this.light)
      this.light.position.set(
        this.position.x * this.sim.size.x,
        this.position.y * this.sim.size.y,
        this.position.z * this.sim.size.z
      )
  }

  pause() {
    this.animations.map((animation) => animation.pause())
  }

  resume() {
    this.animations.map((animation) => animation.resume())
  }

  destory() {
    if (this.model) {
      this.model.group.parent.remove(this.model.group)
      // this.model.group.traverse((obj) => {
      //   if (obj.geometry) obj.geometry.dispose()
      //   if (obj.material) obj.material.dispose()
      // })
      this.model = null
    }

    if (this.light) {
      // this.light.intensity = 0
      this.animations.push(gsap.fromTo(this.light, { intensity: 15 }, { intensity: 0, ease: "power1.in", duration: 1 }))
    }

    this.destroyed = true
  }

  emit(particle, group, casted = false) {
    if (!group) group = this.settings.group

    const positionAlongLine = this.previousPosition
      ? vector.lerpVectors(this.previousPosition, this.position, Math.random())
      : this.position

    const position = {
      x: positionAlongLine.x + (Math.random() * 2 - 1) * particle.positionSpread.x,
      y: positionAlongLine.y + (Math.random() * 2 - 1) * particle.positionSpread.y,
      z: positionAlongLine.z + (Math.random() * 2 - 1) * particle.positionSpread.z,
    }

    let direction = {}

    // console.log("direction", particle.direction)
    if (!particle.direction) {
      direction = {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1,
      }
    } else {
      direction = {
        x: this.direction.x * particle.direction.x + (Math.random() * 2 - 1) * particle.directionSpread.x,
        y: this.direction.y * particle.direction.y + (Math.random() * 2 - 1) * particle.directionSpread.y,
        z: this.direction.z * particle.direction.z + (Math.random() * 2 - 1) * particle.directionSpread.z,
      }
    }

    // console.log("direction", direction)

    const speed = particle.speed + Math.random() * particle.speedSpread
    const force = particle.force + Math.random() * particle.forceSpread
    const scale = particle.scale * (particle.scaleSpread > 0 ? Math.random() * particle.scaleSpread : 1)

    // console.log(particle)

    this.sim.createParticle(group, {
      ...particle.settings,
      position,
      direction,
      speed,
      force,
      scale,
      casted,
    })
  }

  tick(delta, elapsedTime) {
    if (this.active && this.settings.emitRate > 0) {
      this.remainingTime += delta
      if (this.mixer) this.mixer.update(delta * this.mixer.timeScale)
      if (this.moveFunction) this.moveFunction(delta, elapsedTime)

      const emitCount = Math.floor(this.remainingTime / this.settings.emitRate)
      // console.logLimited(emitCount)
      this.remainingTime -= emitCount * this.settings.emitRate

      for (let i = 0; i < emitCount; i++) {
        this.emit(this.particles[this.settings.particleOrder[this.count % this.settings.particleOrder.length]])

        this.count++
      }
    }

    this.previousPosition = { ...this.position }
  }
}

class ArcaneSpellEmitter extends Emitter {
  constructor(sim, light, startPosition, enemy) {
    const color = { r: 0.2, g: 0, b: 1 }

    const settings = {
      // model: ASSETS.getModel("parrot"),
      emitRate: 0.001,
      animationDelay: 1,

      startingPosition: startPosition,
      lightColor: color,
      particleOrder: [
        "smoke",
        "smoke",
        "smoke",
        "smoke",
        "smoke",
        "circle",
        // "smoke",
        // "smoke",
        "circle",
        // "smoke",
        // "smoke",
        // "smoke",
        // "smoke",
        // "sparkle",
      ],
    }

    const particles = {
      smoke: new SpellTrailParticle({
        color,
      }),
      sparkle: new SpellTrailParticle({
        style: PARTICLE_STYLES.point,
        scale: 0.1,
      }),
      circle: new SpellTrailParticle({
        color,
        style: PARTICLE_STYLES.disc,
        // scale: 4,
      }),
      explodeSmoke: new ExplodeParticle({ color }),
      explodeSpark: new ExplodeParticle({
        speed: 0.4,
        color: { r: 1, g: 1, b: 1 },
        // force: 2,
        forceDecay: 2,
        style: PARTICLE_STYLES.point,
      }),
      explodeShape: new ExplodeParticle({
        color,
        style: PARTICLE_STYLES.disc,
        scale: 0.5,
      }),
    }

    super(sim, settings, particles, light)

    this.active = false
    this.enemy = enemy
    // console.log("startPostion", startPosition)

    this.particleOrder = ["smoke"]

    // this.lastPosition = { ...this.settings.startingPosition, z: this.settings.startingPosition.z + 0.001 }
    this.lookAt = { x: 0, y: 0, z: 0 }
    this.lookAtTarget = null
    // this.scale = 1
    this.scale = 0.1

    SOUNDS.play("spell-travel")
    this.animations.push(
      gsap.to(
        this.position,

        {
          duration: 0.9,
          delay: this.delay,
          motionPath: {
            curviness: 1.5,
            // resolution: 6,
            path: [
              this.position,
              { x: 0.5, y: Math.random(), z: 0.8 },
              { x: 0.1 + Math.random() * 0.8, y: 0.2 + Math.random() * 0.4, z: 0.4 },
              this.enemy
                ? { x: this.enemy.location.x, y: 0.4, z: this.enemy.location.z }
                : { x: 0.1 + Math.random() * 0.8, y: 1, z: 0.2 },
            ],
          },
          ease: "linear",
          onStart: () => {
            if (this.enemy) this.enemy.incoming()
          },
          onComplete: () => this.onComplete(),
          onUpdate: () => this.onUpdate(),
        }
      )
    )

    // gsap.to(this, { duration: 0.3, scale: 1, ease: "linear" })

    // gsap.to(this.settings.directionSpread, { duration: 1, x: 0.001, y: 0.001, z: 0.001, ease: "power4.in" })
  }

  onComplete = () => {
    if (this.enemy) {
      this.enemy.kill()
      SOUNDS.play("kill")
      const explode = 200
      for (let i = 0; i < explode; i++) {
        const random = Math.random()
        if (random > 0.55) this.emit(this.particles["explodeSmoke"])
        else if (random > 0.1) this.emit(this.particles["explodeSpark"])
        else this.emit(this.particles["explodeShape"])
      }
    }
    this.destory()
  }

  onUpdate = () => {
    if (this.lastPosition) {
      this.direction = {
        x: this.position.x - this.lastPosition.x,
        y: this.position.y - this.lastPosition.y,
        z: this.position.z - this.lastPosition.z,
      }

      if (this.model) {
        this.model.group.position.set(
          this.position.x * this.sim.size.x,
          this.position.y * this.sim.size.y,
          this.position.z * this.sim.size.z
        )

        this.lookAtTarget = {
          x: this.sim.startCoords.x + (this.position.x + this.direction.x) * this.sim.size.x,
          y: this.sim.startCoords.y + (this.position.y + this.direction.y) * this.sim.size.y,
          z: this.sim.startCoords.z + (this.position.z + this.direction.z) * this.sim.size.z,
        }

        const lerpAmount = 0.08

        this.lookAt.x = lerp(this.lookAt.x, this.lookAtTarget.x, lerpAmount)
        this.lookAt.y = lerp(this.lookAt.y, this.lookAtTarget.y, lerpAmount)
        this.lookAt.z = lerp(this.lookAt.z, this.lookAtTarget.z, lerpAmount)

        this.model.group.lookAt(this.lookAt.x, this.lookAt.y, this.lookAt.z)
      }
    }
    this.active = true
    this.lastPosition = { ...this.position }
  }
}

class CastEmitter extends Emitter {
  constructor(sim) {
    const settings = {
      emitRate: 0,
      particleOrder: ["sparkle", "sparkle", "sparkle", "sparkle", "smoke"],
    }

    const particles = {
      smoke: new SmokeParticle(),
      sparkle: new SparkleParticle(),
    }

    super(sim, settings, particles)
  }

  move(position) {
    this.position = position

    const emitCount = 10
    for (let i = 0; i < emitCount; i++) {
      this.emit(this.particles[randomFromArray(this.settings.particleOrder)], "magic", true)
    }

    this.previousPosition = { ...this.position }
  }

  reset() {
    this.previousPosition = null
  }
}

class CrystalEnergyEmitter extends ControlledEmitter {
  constructor(sim) {
    super(sim)

    this.emitRate = 0.2
    this._active = false
  }

  tick(delta, elapsedTime) {
    if (this.active && this.emitRate > 0) {
      this.remainingTime += delta
      const emitCount = Math.floor(this.remainingTime / this.emitRate)
      this.remainingTime -= emitCount * this.emitRate

      for (let i = 0; i < emitCount; i++) {
        const particle = this.emit({
          life: 1,
          size: 0.4,
          color: { r: 0.8, g: Math.random(), b: 1 },
          position: {
            x: 0.5 + (Math.random() * 0.05 - 0.025),
            y: 0.5 + (Math.random() * 0.05 - 0.025),
            z: 0.5 + (Math.random() * 0.05 - 0.025),
          },
        })

        particle.animation = gsap.to(particle, {
          y: 0.35,
          x: 0.5,
          z: 0.5,
          duration: 2,
          life: 0.5,
          ease: "power4.in",
          onUpdate: () => this.update(particle),
          onComplete: () => this.destory(particle),
        })
      }
    }
  }

  set active(value) {
    this.remainingTime = 0
    this._active = value
  }

  get active() {
    return this._active
  }
}

class DustEmitter extends Emitter {
  constructor(sim, assets) {
    const settings = {
      emitRate: 0.03,
      particleOrder: ["dust"],
    }

    const particles = {
      dust: new DustParticle(),
    }

    super(sim, settings, particles)

    const startCount = 5
    for (let i = 0; i < startCount; i++) {
      this.emit(this.particles["dust"], "smoke")
    }
  }
}

class EnemyEnergyEmitter extends ControlledEmitter {
  constructor(sim, location) {
    super(sim)

    this.location = location
    this.emitRate = 0.05
    // this.active = true
  }

  start() {
    this.active = true
  }

  stop() {
    this.active = false
  }

  tick(delta, elapsedTime) {
    if (this.active && this.emitRate > 0) {
      this.remainingTime += delta
      const emitCount = Math.floor(this.remainingTime / this.emitRate)
      // console.logLimited(emitCount)
      this.remainingTime -= emitCount * this.emitRate

      for (let i = 0; i < emitCount; i++) {
        const particle = this.emit({
          life: 1,
          size: 0.3 + Math.random() * 0.1,
          style: Math.random() > 0.5 ? PARTICLE_STYLES.plus : PARTICLE_STYLES.point,
          color: { r: 0.8, g: Math.random(), b: 1 },
        })

        particle.aniamtion = gsap.to(particle, {
          motionPath: [
            { x: 0.5, y: 0.35, z: 0.5 },
            {
              x: simplelerp(0.5, this.location.x, 0.5) + Math.random() * 0.1,
              y: 0.4 + Math.random() * 0.1,
              z: simplelerp(0.5, this.location.z, 0.5) + Math.random() * 0.1,
            },
            { x: this.location.x, y: 0.3, z: this.location.z },
          ],
          duration: 1 + Math.random() * 0.5,
          life: 0.1,
          ease: "none",
          onUpdate: () => this.update(particle),
          onComplete: () => this.destory(particle),
        })
      }
    }
  }
}

class FireSpellEmitter extends Emitter {
  constructor(sim, light, startPosition, enemy) {
    const settings = {
      // model: ASSETS.getModel("skull"),
      emitRate: 0.01,
      animationDelay: 1,
      startingDirection: { x: 0, y: 1, z: 0 },
      startingPosition: startPosition,
      particleOrder: ["flame"],
      lightColor: { r: 0.9, g: 0.8, b: 0.1 },
    }

    const color = { r: 1, g: 0.8, b: 0 }

    const particles = {
      flame: new FlameParticle({
        scale: 2,
      }),
      ember: {
        speed: 0.5,
        color: { r: 1, g: 0.3, b: 0 },
        speedSpread: 0.3,
        forceSpread: 0,
        direction: { x: 1, y: 1, z: 1 },
        lifeDecay: 1.5,
        force: 0,
        type: 1,
        directionSpread: { x: 0.1, y: 0.1, z: 0.1 },
        positionSpread: { x: 0, y: 0, z: 0 },
        acceleration: 0.02,
      },

      explodeSmoke: new ExplodeParticle({ color, speed: 0.1, forceDecay: 1.1 }),
      explodeSpark: new ExplodeParticle({
        speed: 0.4,
        color: { r: 1, g: 1, b: 1 },
        // force: 2,
        forceDecay: 2,
        // style: PARTICLE_STYLES.point,
      }),
      explodeShape: new ExplodeParticle({
        color,
        style: PARTICLE_STYLES.circle,
        scale: 0.5,
      }),
    }

    super(sim, settings, particles, light)

    this.active = false
    // console.log("startPostion", startPosition)

    this.particleOrder = ["flame"]

    this.lastPosition = { ...this.settings.startingPosition, z: this.settings.startingPosition.z + 0.001 }
    this.lookAt = null
    this.lookAtTarget = null
    // this.scale = 1
    this.scale = 0.1

    if (this.model) {
      this.model.group.rotateX(math.degToRad(-160))
      this.model.group.rotateZ(math.degToRad(-40))
      this.model.group.scale.set(0, 0, 0)
    }

    this.onUpdate(true)
    this.enemy = enemy

    const introDuration = 0.5

    SOUNDS.play("spell-travel")

    if (this.model) {
      this.animations.push(
        gsap.to(this.model.group.scale, {
          motionPath: [
            // { x: 0, y: 0, z: 0 },
            { x: 2, y: 2, z: 2 },
            { x: 1, y: 1, z: 1 },
          ],
          ease: "power1.inOut",
          duration: this.delay + introDuration * 1.2,
        })
      )
      this.animations.push(
        gsap.to(this.model.group.rotation, {
          motionPath: [
            { y: math.degToRad(0), x: math.degToRad(-160), z: math.degToRad(-40) },
            { y: math.degToRad(0), x: math.degToRad(-90), z: math.degToRad(192) },
          ],
          ease: "power1.inOut",
          duration: this.delay + introDuration,
        })
      )
    }

    this.animations.push(
      gsap.to(this.position, {
        duration: 1,
        delay: this.delay + introDuration * 0.25,
        motionPath: {
          curviness: 1.5,
          // resolution: 6,
          path: [
            this.position,
            { x: 0.5, y: Math.random(), z: 0.8 },
            { x: 0.1 + Math.random() * 0.8, y: 0.2 + Math.random() * 0.4, z: 0.4 },
            this.enemy
              ? { x: this.enemy.location.x, y: 0.4, z: this.enemy.location.z }
              : { x: 0.1 + Math.random() * 0.8, y: 1, z: 0.2 },
          ],
        },
        ease: "power1.in",
        onStart: () => {
          if (this.enemy) this.enemy.incoming()
          this.settings.emitRate = 0.005
        },
        onComplete: () => this.onComplete(),
        onUpdate: () => this.onUpdate(),
      })
    )

    // gsap.to(this, { duration: 0.3, scale: 1, ease: "linear" })

    // gsap.to(this.settings.directionSpread, { duration: 1, x: 0.001, y: 0.001, z: 0.001, ease: "power4.in" })
  }

  onComplete = () => {
    if (this.enemy) {
      SOUNDS.play("kill")
      this.enemy.kill()
      const explode = 500
      for (let i = 0; i < explode; i++) {
        const random = Math.random()
        if (random > 0.55) this.emit(this.particles["explodeSmoke"])
        else if (random > 0.1) this.emit(this.particles["explodeSpark"])
        else this.emit(this.particles["explodeShape"])
      }
    }
    this.destory()
  }

  onUpdate = (skipDirection = false) => {
    // if (this.lastPosition) {
    if (!skipDirection)
      this.direction = {
        x: this.position.x - this.lastPosition.x,
        y: this.position.y - this.lastPosition.y,
        z: this.position.z - this.lastPosition.z,
      }

    if (this.model) {
      this.model.group.position.set(
        this.position.x * this.sim.size.x,
        this.position.y * this.sim.size.y,
        this.position.z * this.sim.size.z
      )

      // this.lookAtTarget = {
      //   x: this.sim.startCoords.x + (this.position.x + this.direction.x) * this.sim.size.x,
      //   y: this.sim.startCoords.y + (this.position.y + this.direction.y) * this.sim.size.y,
      //   z: this.sim.startCoords.z + (this.position.z + this.direction.z) * this.sim.size.z,
      // }

      // const lerpAmount = 0.08

      // this.lookAt.x = lerp(this.lookAt.x, this.lookAtTarget.x, lerpAmount)
      // this.lookAt.y = lerp(this.lookAt.y, this.lookAtTarget.y, lerpAmount)
      // this.lookAt.z = lerp(this.lookAt.z, this.lookAtTarget.z, lerpAmount)

      // this.model.group.lookAt(this.lookAt.x, this.lookAt.y, this.lookAt.z)
    }
    // }
    this.active = true
    this.lastPosition = { ...this.position }
  }
}

class GhostEmitter extends Emitter {
  constructor(sim) {
    const settings = {
      emitRate: 0,
      particleOrder: ["trailSmoke"],
      startingDirection: { x: 0, y: -1, z: 0 },
      group: "smoke",
      // direction: { x: -1, y: -1, z: -1 },
    }

    const particles = {
      trailSmoke: new SmokeParticle({
        positionSpread: { x: 0.03, y: 0.03, z: 0.03 },
        directionSpread: { x: 0.3, y: 0, z: 0.3 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0.2,
        speed: 0.3,
        speedDecay: 0.2,
        lifeDecay: 0.8,
        acceleration: 0.1,
        scale: 0.4,
      }),
      smoke: new SmokeParticle({
        color: { r: 0, g: 0, b: 0 },
        positionSpread: { x: 0.05, y: 0, z: 0.05 },
        directionSpread: { x: 0.3, y: 0, z: 0.3 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0,
        speed: 0.3,
        speedDecay: 0.2,
        lifeDecay: 0.4,
        acceleration: 0.1,
        scale: 1,
      }),
      force: new ForceParticle({
        directionSpread: { x: 0.4, y: 0, z: 0.4 },
      }),
      smokeUp: new SmokeParticle({
        color: { r: 0, g: 0, b: 0 },
        positionSpread: { x: 0.1, y: 0.3, z: 0.1 },
        directionSpread: { x: 0.3, y: 0, z: 0.3 },
        direction: { x: -1, y: -1, z: -1 },
        force: 0.2,
        speed: 0.6,
        speedDecay: 0.2,
        lifeDecay: 0.6,
        acceleration: 0,
        scale: 1,
      }),
      sparkle: new SparkleParticle({
        speed: 0.6,
        life: 1.0,
        lifeDecay: 0.7,
        positionSpread: { x: 0.1, y: 0.1, z: 0.1 },
        directionSpread: { x: 1, y: 1, z: 1 },
        // style: PARTICLE_STYLES.skull,
        // scaleSpread: 0,
      }),
    }

    super(sim, settings, particles)
  }

  puffOfSmoke(sparkles = false) {
    const smokePuff = 50
    for (let i = 0; i < smokePuff; i++) {
      this.emit(this.particles["smokeUp"], "smoke")
    }
    if (sparkles) {
      const sparks = 100
      for (let i = 0; i < sparks; i++) {
        this.emit(this.particles["sparkle"], "magic")
      }
    }
  }

  animatingIn() {
    this.settings.emitRate = 0.0015
  }

  idle() {
    this.settings.particleOrder = ["force", "smoke", "smoke", "smoke", "smoke", "smoke", "smoke"]
    this.settings.emitRate = 0.03
  }
}

class TorchEmitter extends Emitter {
  constructor(position, sim) {
    const settings = {
      emitRate: 0.03,
      particleOrder: ["force", "flame", "redFlame", "smoke", "flame", "redFlame", "smoke", "flame", "flame"],
      startingPosition: position,
      startingDirection: { x: 0, y: 1, z: 0 },
      // direction: { x: -1, y: -1, z: -1 },
    }

    const particles = {
      flame: new FlameParticle({
        positionSpread: { x: 0, y: 0, z: 0 },
        directionSpread: { x: 0.4, y: 0, z: 0.4 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0.1,
        speed: 0.25,
        speedDecay: 0.99,
        lifeDecay: 1.7,
        acceleration: 0.2,
        scale: 2.5,
        scaleSpread: 0.3,
      }),
      redFlame: new FlameParticle({
        color: { r: 1, g: 0.3, b: 0 },
        positionSpread: { x: 0, y: 0, z: 0 },
        directionSpread: { x: 0.4, y: 0, z: 0.4 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0.1,
        speed: 0.3,
        speedDecay: 0.99,
        lifeDecay: 1,
        acceleration: 0.2,
        scale: 2.5,
        scaleSpread: 0.3,
      }),
      smoke: new SmokeParticle({
        positionSpread: { x: 0, y: 0, z: 0 },
        directionSpread: { x: 0.4, y: 0, z: 0.4 },
        direction: { x: 1, y: 1, z: 1 },
        force: 0.1,
        speed: 0.3,
        speedDecay: 0.6,
        lifeDecay: 0.7,
        acceleration: 0.2,
        color: { r: 0.1, g: 0.1, b: 0.1 },
        scale: 4,
        scaleSpread: 0.3,
      }),

      force: new ForceParticle(),
    }

    super(sim, settings, particles)
  }

  flamePuff() {
    gsap.fromTo(this.particles.flame, { scale: 5 }, { scale: 2.5, duration: 1 })
  }

  set green(value) {
    if (value) {
      this.particles.flame.color = { r: 0, g: 1, b: 0 }
      this.particles.redFlame.color = { r: 0.5, g: 1, b: 0.2 }
    } else {
      this.particles.flame.color = { r: 1, g: 1.0, b: 0.3 }
      this.particles.redFlame.color = { r: 1, g: 0.3, b: 0 }
    }
  }
}

class VortexSpellEmitter extends Emitter {
  constructor(sim, light, startPosition) {
    const color = { r: 0, g: 1, b: 0 }

    const settings = {
      // model: ASSETS.getModel("parrot"),
      emitRate: 0.0001,
      animationDelay: 1,

      startingPosition: startPosition,
      lightColor: color,
      particleOrder: ["smoke", "smoke", "smoke", "smoke", "smoke", "circle", "circle"],
    }

    const particles = {
      smoke: new SpellTrailParticle({
        color,
      }),
      sparkle: new SpellTrailParticle({
        style: PARTICLE_STYLES.point,
        scale: 0.1,
      }),
      circle: new SpellTrailParticle({
        color,
        style: PARTICLE_STYLES.disc,
        // scale: 4,
      }),
      explodeSmoke: new ExplodeParticle({
        color,
        // force: 0,
        direction: { x: 0, y: 1, z: 0 },
        directionSpread: { x: 0.05, y: 0.05, z: 0.05 },
      }),
      explodeSpark: new ExplodeParticle({
        speed: 0.1,
        direction: { x: 0, y: 1, z: 0 },
        directionSpread: { x: 0.05, y: 0.05, z: 0.05 },
        color: { r: 1, g: 1, b: 1 },
        // force: 2,

        speedDecay: 0.99,
        lifeDecay: 0.9,
        style: PARTICLE_STYLES.point,
        acceleration: 0.01,
      }),
      explodeShape: new ExplodeParticle({
        color,

        direction: { x: 0, y: 1, z: 0 },
        directionSpread: { x: 0.05, y: 0.05, z: 0.05 },
        style: PARTICLE_STYLES.disc,

        speedDecay: 0.99,
        scale: 0.9,
        speed: 0.1,
        lifeDecay: 0.8,
        acceleration: 0.01,
      }),
    }

    super(sim, settings, particles, light)

    this.active = false

    this.particleOrder = ["smoke"]

    this.lookAt = { x: 0, y: 0, z: 0 }
    this.lookAtTarget = null
    this.scale = 0.1

    SOUNDS.play("spell-travel")

    this.animations.push(
      gsap.to(
        this.position,

        {
          duration: 0.6,
          delay: this.delay,

          motionPath: {
            curviness: 0.5,
            // resolution: 6,
            path: [
              { x: 0.5, y: 1, z: 0.5 },
              { x: 0.5, y: 0.1, z: 0.5 },
            ],
          },
          ease: "linear",
          onComplete: () => this.onComplete(),
          onUpdate: () => this.onUpdate(),
        }
      )
    )
  }

  onComplete = () => {
    const explode = 1000
    for (let i = 0; i < explode; i++) {
      const random = Math.random()
      if (random > 0.55) this.emit(this.particles["explodeSmoke"])
      else if (random > 0.1) this.emit(this.particles["explodeSpark"])
      else this.emit(this.particles["explodeShape"])
    }

    this.destory()
  }

  onUpdate = () => {
    // if (this.lastPosition) {
    //   this.direction = {
    //     x: this.position.x - this.lastPosition.x,
    //     y: this.position.y - this.lastPosition.y,
    //     z: this.position.z - this.lastPosition.z,
    //   }
    // }
    this.active = true
    this.lastPosition = { ...this.position }
  }
}

class WinEmitter extends Emitter {
  constructor(sim, assets) {
    const settings = {
      emitRate: 0.001,
      particleOrder: ["dustRed", "dustGreen", "dustBlue"],
    }

    const particles = {
      dustRed: new DustParticle({ color: { r: 1, g: 1, b: 0 }, style: PARTICLE_STYLES.point, scale: 0.5 }),
      dustGreen: new DustParticle({ color: { r: 0, g: 1, b: 1 }, style: PARTICLE_STYLES.point, scale: 0.5 }),
      dustBlue: new DustParticle({ color: { r: 1, g: 0, b: 1 }, style: PARTICLE_STYLES.point, scale: 0.5 }),
    }

    super(sim, settings, particles)

    // const startCount = 5
    // for (let i = 0; i < startCount; i++) {
    //   this.emit(this.particles["dustGreen"], "magic")
    // }
  }
}

// DEMON

class Enemy {
  constructor(sim, demon, spell) {
    this.machine = interpret(EnemyMachine)
    this.sim = sim
    this.timeOffset = Math.random() * (Math.PI * 2)
    this.state = this.machine.initialState.value

    this.uniforms = demon.uniforms
    this.onDeadCallback = null

    this.animations = []

    const availableSpellTypes = Object.keys(SPELLS).map((key) => SPELLS[key])
    this.spellType = spell ? spell : availableSpellTypes[Math.floor(Math.random() * availableSpellTypes.length)]

    // const geometry = new BoxGeometry(0.1, 0.15, 0.05)
    // const material = new MeshStandardMaterial({ color: this.spellType === SPELLS.arcane ? 0xbb11ff : 0xbbff11 })

    // this.model = new Mesh(geometry, material)

    this.demon = demon
    this.model = demon.demon

    this.elements = {
      leftHand: null,
      rightHand: null,
      sphere: null,
      cloak: null,
      skullParts: [],
    }

    this.model.scene.traverse((item) => {
      if (this.elements[item.name] === null) this.elements[item.name] = item
      else if (item.name.includes("skull")) this.elements.skullParts.push(item)

      if (item.name === "cloak") {
        item.material.onBeforeCompile = (shader) => {
          console.log("COMPILING SHADER")
        }
      }
    })

    this.modelOffset = { x: 0, y: -0.6, z: 0 }

    this.group = this.model.group
    // this.group.add(this.model)

    this.position = { x: 0, y: 0, z: 0 }

    this.emitter = new GhostEmitter(sim)
    this.emitter.emitRate = 0

    this.machine.onTransition((s) => this.onStateChange(s))
    this.machine.start()
  }

  moveFunction(delta, elapsedTime) {
    if (this.state === "ALIVE" || this.state === "TAGGED") {
      this.position.y = 0.2 + 0.15 * ((Math.sin(elapsedTime + this.timeOffset) + 1) * 0.5)
    }
  }

  pause() {
    this.animations.map((animation) => animation.pause())
  }

  resume() {
    this.animations.map((animation) => animation.resume())
  }

  spawn(location) {
    this.location = location
    this.location.add(this.group)
    this.group.rotation.y = this.location.rotation
    this.model.scene.visible = false

    this.machine.send("spawn")
  }

  incoming() {
    this.machine.send("incoming")
  }

  kill() {
    this.machine.send("kill")
  }

  accend() {
    this.machine.send("accend")
  }

  getSuckedIntoTheAbyss() {
    this.machine.send("vortex")
  }

  onStateChange = (state) => {
    this.state = state.value
    if (state.changed || this.state === "IDLE") {
      switch (this.state) {
        case "IDLE":
          this.model.scene.rotation.set(0, 0, 0)
          break
        case "ANIMATING_IN":
          if (this.location) {
            SOUNDS.play("enter")
            const entrancePath = this.location.getRandomEntrance()
            this.animations.push(
              gsap.fromTo(
                this.position,
                { ...entrancePath.points[0] },
                {
                  motionPath: { path: entrancePath.points, curviness: 2 },
                  ease: "none",
                  duration: 1.1,
                  onStart: () => {
                    setTimeout(() => {
                      this.emitter.animatingIn()
                    }, 100)
                  },
                }
              )
            )

            this.animations.push(gsap.from(this.elements.leftHand.position, { z: -0.1, duration: 2 }))
            this.animations.push(gsap.from(this.elements.leftHand.scale, { x: 0, y: 0, z: 0, duration: 2 }))

            this.animations.push(gsap.from(this.elements.rightHand.position, { z: -0.1, duration: 2 }))
            this.animations.push(gsap.from(this.elements.rightHand.scale, { x: 0, y: 0, z: 0, duration: 2 }))

            this.elements.skullParts.forEach((part) => {
              this.animations.push(
                gsap.from(part.rotation, {
                  y: (Math.random() - 0.5) * 0.1,
                  x: 1.5,

                  ease: "power2.inOut",
                  delay: 0.8,
                  duration: 1,
                })
              )
              this.animations.push(gsap.from(part.scale, { x: 0.2, y: 4, z: 0.2, delay: 0.8, duration: 1 }))
              this.animations.push(gsap.from(part.position, { y: 0.1, delay: 0.8, duration: 1 }))
            })

            this.animations.push(gsap.from(this.elements.cloak.scale, { y: 0.2, duration: 1.7 }))

            this.animations.push(gsap.delayedCall(1, this.machine.send, ["complete"]))
            const trail = entrancePath.trail
            const material = trail.material

            entrancePath.entrance.enter()

            this.animations.push(
              gsap.fromTo(
                material.uniforms.progress,
                { value: 0 },
                {
                  duration: 1.1,
                  delay: 0.2,
                  value: 1,
                  ease: "none",
                  onStart: () => {
                    trail.visible = true
                  },
                  onComplete: () => {
                    trail.visible = false
                  },
                }
              )
            )
          } else {
            this.machine.send("complete")
          }
          break
        case "ALIVE":
          SOUNDS.play("laugh")
          this.emitter.puffOfSmoke()
          this.emitter.idle()
          this.model.scene.visible = true
          this.location.energyEmitter.start()
          this.animations.push(
            gsap.fromTo(
              this.model.scene.scale,
              { x: 0.1, y: 0.001, z: 0.1 },
              { x: 0.9, y: 0.9, z: 0.9, ease: "power4.out", duration: 0.2 }
            )
          )
          this.animations.push(gsap.fromTo(this.modelOffset, { y: 0 }, { y: -0.05, ease: "back", duration: 0.5 }))
          break
        case "TAGGED":
          break
        case "ANIMATING_OUT":
          this.emitter.puffOfSmoke()
          this.emitter.destory()
          this.location.energyEmitter.stop()
          this.animations.push(
            gsap.to(this.elements.cloak.scale, {
              x: 12,
              y: 9,
              z: 9,
              ease: "power3.out",
              duration: 1.5,
            })
          )

          this.animations.push(
            gsap.to(this.uniforms.out, {
              value: 1,
              ease: "back.in",
              delay: 0.2,
              duration: 1,
              onComplete: () => {
                this.emitter.puffOfSmoke(true)
                this.machine.send("complete")
              },
            })
          )

          this.elements.skullParts.forEach((part) => {
            const duration = 1 + Math.random() * 0.3
            this.animations.push(
              gsap.to(part.position, {
                delay: 0.15,
                y: (Math.random() - 0.5) * 0.1,
                x: (Math.random() - 0.5) * 0.3,
                z: (Math.random() - 0.5) * 0.3,
                ease: "back.in",
                duration,
              })
            )
            this.animations.push(
              gsap.to(part.rotation, {
                delay: 0,
                y: (Math.random() - 0.5) * 0.8,
                x: (Math.random() - 0.5) * 0.8,
                z: (Math.random() - 0.5) * 0.8,
                ease: "power2.inOut",
                duration,
              })
            )
            this.animations.push(
              gsap.to(part.scale, {
                delay: 0.2,
                y: 0,
                x: 0,
                z: 0,
                ease: "back.in",
                duration: duration * 0.6,
              })
            )

            this.animations.push(
              gsap.to(this.elements.leftHand.scale, {
                x: 0,
                y: 0,
                z: 0,
                ease: "power3.out",
                duration: 0.6,
              })
            )

            this.animations.push(
              gsap.to(this.elements.rightHand.scale, {
                x: 0,
                y: 0,
                z: 0,
                ease: "power3.out",
                duration: 0.6,
              })
            )

            // this.elements.sphere.visible = false
            // this.animations.push(gsap.from(part.scale, { x: 0.2, y: 4, z: 0.2, delay: 0.8, duration: 1 }))
            // this.animations.push(gsap.from(part.position, { y: 0.1, delay: 0.8, duration: 1 }))
          })
          break
        case "VORTEX_ANIMATION":
          this.emitter.destory()
          this.location.energyEmitter.stop()

          const mainDelay = Math.random() * 0.5
          const moveDelay = mainDelay + 1.5

          this.animations.push(
            gsap.to(this.modelOffset, {
              y: -1,
              z: 0.2,
              ease: "power4.in",
              duration: 1,
              delay: moveDelay,
              onComplete: () => this.machine.send("complete"),
            })
          )

          this.animations.push(
            gsap.to(this.model.scene.rotation, {
              y: Math.random() * 2,

              ease: "power4.in",
              duration: 1.5,
              delay: mainDelay + 1,
            })
          )

          this.animations.push(
            gsap.to(this.model.scene.scale, {
              y: 1.2,

              ease: "power4.in",
              duration: 1.5,
              delay: mainDelay + 1,
            })
          )

          this.animations.push(
            gsap.to(this.uniforms.stretch, {
              value: 1,
              ease: "power4.in",
              delay: mainDelay,
              duration: 2,
            })
          )

          break
        case "DEAD":
          this.destory()
          break
        case "GONE":
          this.emitter.destory()
          this.destory()
          break
        case "ACCEND":
          this.location.energyEmitter.stop()
          this.animations.push(
            gsap.to(this.position, {
              y: 1.1,
              ease: "Power4.in",
              duration: 0.6,
              delay: Math.random(),
              onStart: () => this.emitter.puffOfSmoke(),
              onComplete: () => {
                this.destory()
                this.machine.send("leave")
              },
            })
          )
      }
    }
  }

  resetDemon() {
    console.log("----reseting demon")
    console.log(this.uniforms)
    this.uniforms.in.value = 0
    this.uniforms.out.value = 0
    this.uniforms.stretch.value = 0
    this.model.scene.traverse((item) => {
      if (item.isMesh) {
        const types = ["position", "rotation", "scale"]
        types.forEach((type) => {
          item[type].set(item.home[type].x, item.home[type].y, item.home[type].z)
        })
      }
    })
  }

  destory() {
    if (this.model) {
      this.group.removeFromParent()
      this.resetDemon()
      this.demon.returnToPool()
      // this.model.scene.parent.remove(this.model.scene)
      // this.model = null
    }

    this.animations.forEach((animation) => {
      animation.kill()
      animation = null
    })

    if (this.location) this.location.release()

    if (this.onDeadCallback) {
      this.onDeadCallback()
      this.onDeadCallback = null
    }
  }

  tick(delta, elapsedTime) {
    this.uniforms.time.value = elapsedTime
    this.moveFunction(delta, elapsedTime)

    this.group.position.set(
      this.position.x * this.sim.size.x,
      this.position.y * this.sim.size.y,
      this.position.z * this.sim.size.z
    )

    this.model.scene.position.set(
      this.modelOffset.x * this.sim.size.x,
      this.modelOffset.y * this.sim.size.y,
      this.modelOffset.z * this.sim.size.z
    )

    if (this.location)
      this.emitter.position = {
        x: this.position.x + this.location.position.x,
        y: this.position.y + this.location.position.y,
        z: this.position.z + this.location.position.z,
      }
  }

  get dead() {
    return this.state === "DEAD" || this.state === "GONE"
  }

  get active() {
    return this.state === "ALIVE"
  }
}

/* 
  The demon needs a little moment to get loaded
	into memory. So rather than wait for the first
	in game enemy to appear and get hit with a 
	stutter, we use this preloader to do some 
	heavy lifting during the loading screen
*/

class EnemyPreloader {
  constructor(stage) {
    this.totalDemons = 6
    this.demons = []

    for (let i = 0; i < this.totalDemons; i++) {
      this.demons.push({
        isAvailable: true,
        returnToPool: function () {
          this.isAvailable = true
        },
        uniforms: {
          in: { value: 0 },
          out: { value: 0 },
          stretch: { value: 0 },
          time: { value: 1 },
        },
        demon: ASSETS.getModel("demon", true),
      })
    }

    this.demons.forEach((enemy, i) => {
      enemy.demon.group.position.y = -0.1
      enemy.demon.group.position.x = 0.05 + 0.02 * (i + 1)
      stage.add(enemy.demon.group)
      enemy.demon.scene.traverse((item) => {
        if (item.name === "cloak") {
          // item.castShadow = true

          // item.material.transparent = true
          // item.material.forceSinglePass = true
          // item.renderOrder = 0
          // item.material.writeDepth = false

          item.material.onBeforeCompile = (shader) => {
            // const uniform = { value: 1 }

            shader.uniforms.uIn = enemy.uniforms.in
            shader.uniforms.uOut = enemy.uniforms.out
            shader.uniforms.uStretch = enemy.uniforms.stretch
            shader.uniforms.uTime = enemy.uniforms.time

            shader.vertexShader = shader.vertexShader.replace(
              "#define STANDARD",
              `#define STANDARD
							
							${includes.noise}
							uniform float uOut;
							uniform float uTime;
							uniform float uStretch;
							varying vec2 vUv;
							varying float vNoise;
							`
            )

            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              `
									#include <begin_vertex>
					
									vUv = uv;
									float xNoise = snoise(vec2((position.x * 200.0) + (position.z * 100.0), uTime * (0.6 + (0.3 * uOut))));
									float yNoise = snoise(vec2((position.y * 200.0) + (position.z * 100.0), uTime * (0.6 + (0.3 * uOut))));
									float amount = (0.0015 + 0.02 * uOut) ;

                  float moveAmount = smoothstep(0.02 + (1.0 * uOut), 0.0, position.y);

									transformed.x += moveAmount * amount * xNoise;
									transformed.y += moveAmount * amount * yNoise;

									transformed.x = transformed.x * (1.0 - uOut);
									transformed.y = transformed.y * (1.0 - uOut)+ (0.0 * uOut);
									transformed.z = transformed.z * (1.0 - uOut);

                  transformed.y -= (moveAmount * uStretch) * 0.01;
                  transformed.x += (moveAmount * uStretch) * 0.003;
									
									vNoise = snoise(vec2(position.x * 500.0, position.y * 500.0 ));
							`
            )

            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <common>",
              `
            		uniform float uIn;
            		uniform float uOut;
            		uniform float uTime;
            		varying vec2 vUv;
            		varying float vNoise;

								${includes.noise}

            		#include <common>
            `
            )
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <output_fragment>",
              `#include <output_fragment>

              // float noise = snoise(vUv);

              // vec3 blackout = mix(vec3(vUv, 1.0), gl_FragColor.rgb, uOut);
							float noise = snoise(vUv * 80.0);

							float glowNoise = snoise((vUv * 4.0) + (uTime * 0.75));
							float glow = smoothstep(0.3, 0.5, glowNoise);
							glow *= smoothstep(0.7, 0.5, glowNoise);
							// glowNoise = smoothstep(0.7, 0.5, glowNoise);

							float grad =  smoothstep(0.925 + (uOut * 0.2), 1.0, vUv.y) * noise;
							

              // gl_FragColor = vec4(vec3(grad, 0.0, 0.0), 1.0 - grad);
              // gl_FragColor.a = 1.0 - grad;
              gl_FragColor.rgb *= 1.0 - grad;
              gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0), glow * 0.2 * pow(uOut, 0.25) )  ;
							
            `
            )

            enemy.demon.group.removeFromParent()
          }
        }
      })
    })
  }

  resetAll() {
    this.demons.forEach((d) => (d.isAvailable = true))
  }

  borrowDemon() {
    const availableDemons = this.demons.filter((d) => d.isAvailable)

    const demon = availableDemons[0]
    demon.isAvailable = false
    return demon
  }
}

// LIGHTS

class CrystalLight {
  constructor(position, offset) {
    const color = new Color("#861388")
    this.position = position
    this.offset = offset
    this.group = new Group()
    this.pointLight = new PointLight(color, 5, 0.8)

    this.group.add(this.pointLight)
    this.group.position.set(position.x, position.y, position.z)

    if (window.DEBUG.lights) {
      const helper = new Mesh(new SphereGeometry(0.02), new MeshBasicMaterial(0xffffff))
      this.group.add(helper)
    }
  }

  get light() {
    return this.group
  }

  tick(delta, elapsedTime) {
    // this.group.position.set(
    //   this.position.x, // * this.offset.x,
    //   this.position.y, // * this.offset.y,
    //   this.position.z // * this.offset.z
    // )
    // const n = (Math.cos(elapsedTime * 1.8) + 1) * 0.5
    // this.pointLight.intensity = 8 + 6 * n
  }
}

class TorchLight {
  constructor(position, offset, noise) {
    const color = new Color("#FA9638")
    this.position = position
    this.offset = offset
    this.group = new Group()
    this.pointLight = new PointLight(color, 0, 0.6)
    this.group.add(this.pointLight)
    this.group.position.set(
      this.position.x * this.offset.x,
      this.position.y * this.offset.y,
      this.position.z * this.offset.z
    )
    this.noise = noise
    this._active = false
    this.baseIntesity = 1

    if (window.DEBUG.lights) {
      const helper = new Mesh(new SphereGeometry(0.02), new MeshBasicMaterial({ color: 0xff0000 }))
      this.group.add(helper)
    }
  }

  get light() {
    return this.group
  }

  get object() {
    return this.group
  }

  set active(value) {
    if (value !== this._active) {
      this._active = value
      if (this._active) {
        gsap.fromTo(this, { baseIntesity: 3 }, { baseIntesity: 1, duration: 0.3 })
      }
    }
  }

  set color(newColor) {
    this.pointLight.color = new Color(newColor)
  }

  tick(delta, elapsedTime) {
    const n = this.noise(this.position.x * 2, this.position.y * 2, elapsedTime * 3) + 1 * 0.5
    this.pointLight.intensity = this._active ? this.baseIntesity + 0.5 * n : 0
  }
}

// PARTICLES

class ParticleType {
  constructor(settings) {
    this.settings = { ...DEFAULT_PARTICLE_SETTINGS, ...settings }
  }

  get speed() {
    return this.settings.speed
  }

  get speedDecay() {
    return this.settings.speedDecay
  }

  get speedSpread() {
    return this.settings.speedSpread
  }

  get force() {
    return this.settings.force
  }

  get forceDecay() {
    return this.settings.forceDecay
  }

  get forceSpread() {
    return this.settings.forceSpread
  }

  get life() {
    return this.settings.life
  }

  get lifeDecay() {
    return this.settings.lifeDecay
  }

  get directionSpread() {
    return this.settings.directionSpread
  }

  get direction() {
    return this.settings.direction
  }

  get position() {
    return this.settings.position
  }

  get positionSpread() {
    return this.settings.positionSpread
  }

  get color() {
    return this.settings.color
  }

  set color(value) {
    this.settings.color = value
  }

  get scale() {
    return this.settings.scale
  }

  set scale(value) {
    this.settings.scale = value
  }

  get scaleSpread() {
    return this.settings.scaleSpread
  }

  get style() {
    return this.settings.style
  }

  get acceleration() {
    return this.settings.acceleration
  }
}

class DustParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0,
      speedDecay: 0.4,
      color: { r: 0.5, g: 0.5, b: 0.5 },
      speedSpread: 0,
      forceSpread: 0,
      force: 0,
      style: PARTICLE_STYLES.circle,
      life: 1,
      lifeDecay: 0.3,
      scale: 0.06,
      acceleration: 1,
      positionSpread: { x: 0.5, y: 0.5, z: 0.5 },
      ..._overides,
    })
  }
}

class ExplodeParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0.4,
      speedSpread: 0,
      speedDecay: 0.8,
      forceSpread: 0,
      force: 2,
      forceDecay: 0.9,
      type: PARTICLE_STYLES.smoke,
      ..._overides,
    })
  }
}

class FlameParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0.5,
      speedDecay: 0.4,
      color: { r: 1, g: 1.0, b: 0.3 },
      speedSpread: 0.1,
      forceSpread: 0.2,
      force: 0.8,
      forceDecay: 0.8,
      scale: 1,
      scaleSpread: 1,
      lifeDecay: 1.5,
      direction: { x: 1, y: 1, z: 1 },
      directionSpread: { x: 0.1, y: 0.1, z: 0.1 },
      positionSpread: { x: 0, y: 0, z: 0 },
      acceleration: 0.02,
      style: PARTICLE_STYLES.flame,
      ..._overides,
    })
  }
}

class ForceParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0.4,
      speedDecay: 0.4,
      color: { r: 1, g: 0, b: 0 },
      force: 1,
      forceDecay: 0,
      direction: { x: 1, y: 1, z: 1 },
      directionSpread: { x: 0.3, y: 0, z: 0.3 },
      acceleration: 0,
      scale: 0.3,
      style: window.DEBUG.forceParticles ? PARTICLE_STYLES.circle : PARTICLE_STYLES.invisible,
      ..._overides,
    })
  }
}

class SmokeParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0,
      speedDecay: 0,
      speedSpread: 0,
      forceSpread: 0,
      force: 0,
      life: 1,
      lifeDecay: 0,
      scaleSpread: 1,
      acceleration: 0,
      positionSpread: { x: 0.02, y: 0, z: 0.001 },
      color: { r: 0.75, g: 0.75, b: 0.75 },
      style: PARTICLE_STYLES.smoke,
      scale: 1,
      ..._overides,
    })
  }
}

class SparkleParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}
    super({
      speed: 0.1,
      speedSpread: 0,
      forceSpread: 0,
      force: 0,
      life: 0.5,
      lifeDecay: 0,
      scaleSpread: 1,
      acceleration: 0,
      color: { r: 1, g: 1, b: 1 },
      style: PARTICLE_STYLES.point,
      scale: 1.2,
      speedDecay: 0.2,
      positionSpread: { x: 0.01, y: 0.001, z: 0.01 },
      ..._overides,
    })
  }
}

class SpellTrailParticle extends ParticleType {
  constructor(overrides) {
    const _overides = overrides ? overrides : {}

    super({
      speed: 0.5,
      speedDecay: 0.4,
      color: { r: 1, g: 1, b: 1 },
      speedSpread: 0.1,
      forceSpread: 0.2,
      force: 0.8,
      forceDecay: 0.8,
      scale: 1,
      scaleSpread: 1,
      lifeDecay: 1.5,
      direction: { x: 1, y: 1, z: 1 },
      directionSpread: { x: 0.1, y: 0.1, z: 0.1 },
      positionSpread: { x: 0, y: 0, z: 0 },
      acceleration: 0.02,
      style: PARTICLE_STYLES.smoke,
      ..._overides,
    })
  }
}

// SOUNDS

class SoundController {
  constructor() {
    this.audioListener = new AudioListener()

    this.ready = false

    this.sounds = [
      { id: "music", loop: true, volume: 0.5 },
      { id: "kill", files: ["kill-1", "kill-2", "kill-3"] },
      { id: "enter", files: ["enter-1", "enter-2"] },
      { id: "cast", files: ["cast-1", "cast-2"] },
      { id: "ping", files: ["ping-1", "ping-2"] },
      { id: "laugh", files: ["laugh-1", "laugh-2", "laugh-3"] },
      { id: "error", files: ["error-1"] },
      { id: "spell-travel", files: ["spell-travel-1", "spell-travel-2", "spell-travel-3"] },
      { id: "spell-failed", volume: 0.5, files: ["spell-failed-1", "spell-failed-2"] },
      { id: "trapdoor-close", files: ["trapdoor-close-1", "trapdoor-close-2"] },
      { id: "torch", files: ["torch-1", "torch-2", "torch-3"] },
      { id: "crystal-explode", files: ["crystal-explode"] },
      { id: "crystal-reform", files: ["crystal-reform"] },
      { id: "glitch", volume: 0.8, files: ["glitch"] },
      { id: "portal", files: ["portal"] },
      { id: "crumble", files: ["crumble"] },
      { id: "reform", files: ["reform"] },
    ]
    this.soundMap = {}

    // I initial had the background 'music' as seperate option but decided to merge both options into one. But the logic for supporting more is still here, hence the object and arrays
    this.state = {
      sounds: true,
    }

    this.buttons = {
      // music: document.querySelector("#music-button"),
      sounds: document.querySelector("#sounds-button"),
      soundsText: document.querySelector("#sounds-button .sr-only"),
    }

    for (let i = this.sounds.length - 1; i >= 0; i--) {
      const sound = this.sounds[i]
      if (sound.files) {
        sound.files.forEach((id) => {
          this.sounds.push({
            id,
            loop: sound.loop ? sound.loop : false,
            volume: sound.volume ? sound.volume : 1,
          })
        })
      }
    }
  }

  init(stage) {
    if (window.DEBUG.disableSounds) {
      this.state = { sounds: false }
    }

    stage.camera.add(this.audioListener)

    this.sounds.forEach((d) => {
      if (d.files) {
        this.soundMap[d.id] = {
          selection: d.files,
        }
      } else {
        let buffer = ASSETS.getSound(d.id)

        const sound = new Audio(this.audioListener)
        stage.add(sound)

        sound.setBuffer(buffer)
        sound.setLoop(d.loop ? d.loop : false)
        sound.setVolume(d.volume ? d.volume : 1)

        this.soundMap[d.id] = sound
        d.sound = sound
      }

      this.ready = true
    })

    const types = ["sounds"]
    types.forEach((type) => {
      this.buttons[type].addEventListener("click", () => this.toggleState(type))
      this.updateButton(type)
    })
  }

  initError() {
    return console.error("sounds not initialized")
  }

  toggleState(type) {
    if (!this.ready) return this.initError()
    console.log("toggling", type)
    this.state[type] = !this.state[type]
    this.updateButton(type)

    if (this.state.sounds) {
      this.startMusic()
    } else {
      this.stopAll()
      this.stopMusic()
    }
  }

  updateButton(type) {
    if (this.state[type]) delete this.buttons.sounds.dataset.off
    else this.buttons.sounds.dataset.off = "true"

    const copy = this.buttons.soundsText.dataset.copy
    this.buttons.soundsText.innerText = copy.replace("$$state", this.state[type] ? "off" : "on")
  }

  // setMusicState(state) {
  //   if (!this.ready) return this.initError()
  //   this.state.music = state
  //   if (this.state.music) this.startMusic()
  //   else this.stopMusic()

  //   this.updateButton("music")
  // }

  setSoundsState(state) {
    if (!this.ready) return this.initError()
    this.state.sounds = state
    if (this.state.sounds) {
      this.startMusic()
    } else {
      this.stopAll()
      this.stopMusic()
    }

    this.updateButton("sounds")
  }

  startMusic() {
    if (!this.ready) return this.initError()

    if (this.state.sounds) {
      this.soundMap.music.play()
    } else {
      this.stopMusic()
    }
  }

  stopMusic() {
    if (!this.ready) return this.initError()
    this.soundMap.music.pause()
    this.soundMap.music.isPlaying = false
    // this.soundMap.music.currentTime = 0
  }

  play(id, restart = true) {
    if (!this.ready) return this.initError()
    if (this.state.sounds) {
      const sound = this.soundMap[id]?.selection
        ? this.soundMap[randomFromArray(this.soundMap[id].selection)]
        : this.soundMap[id]

      if (sound) {
        // console.log("playing", id, sound)
        // if (restart) sound.currentTime = 0
        sound.play()
        sound.isPlaying = false
      }
    }
  }

  stopAll() {
    if (!this.ready) return this.initError()

    this.sounds.forEach((d) => {
      if (d.id !== "music" && d.sound) d.sound.pause()
    })
  }
}

const SOUNDS = new SoundController()

// ASSETS

class Assets {
  constructor() {
    this.loadSequence = ["loadModels", "loadSounds", "loadTextures"]

    this.assets = {
      models: {},
      sounds: {},
      textures: {},
    }

    this.manager = new LoadingManager()

    this.loaders = {
      models: new GLTFLoader(this.manager),
      sounds: new AudioLoader(this.manager),
      textures: new TextureLoader(this.manager),
    }

    this.completedSteps = {
      download: false,
      audioBuffers: false,
      models: false,
    }

    this.audioBufferCount = 0
    this.modelLoadCount = 0

    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/")
    this.loaders.models.setDRACOLoader(dracoLoader)

    // this.init()
  }

  checkComplete() {
    const complete = Object.keys(this.completedSteps).reduce((previous, current) =>
      !previous ? false : this.completedSteps[current]
    )
    if (complete) this.onLoadSuccess()
  }

  checkBuffers() {
    // console.log("checking buffers", this.audioBufferCount, TO_LOAD.sounds.length)
    if (this.audioBufferCount === TO_LOAD.sounds.length) {
      this.completedSteps.audioBuffers = true
      this.checkComplete()
    }
  }

  checkModels() {
    // console.log("checking buffers", this.audioBufferCount, TO_LOAD.sounds.length)
    if (this.modelLoadCount === TO_LOAD.models.length) {
      this.completedSteps.models = true
      this.checkComplete()
    }
  }

  load(onLoadSuccess, onLoadError) {
    this.onLoadSuccess = onLoadSuccess
    this.onLoadError = (err) => {
      console.error(err)
      onLoadError(err)
    }

    this.manager.onStart = (url, itemsLoaded, itemsTotal) => {
      console.log(`Started loading file: ${url} \nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
    }

    this.manager.onLoad = () => {
      console.log("Loading complete!")
      this.completedSteps.download = true
      this.checkComplete()
    }

    // this.manager.on

    this.manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      document.body.style.setProperty("--loaded", itemsLoaded / itemsTotal)
      // console.log(`Progress. Loading file: ${url} \nLoaded ${itemsLoaded} of ${itemsTotal} files.`)
    }

    this.manager.onError = (url) => {
      console.log("There was an error loading " + url)
      this.onLoadError(`error loading ${url}`)
    }

    this.loadNext()
  }

  loadNext() {
    if (this.loadSequence.length) {
      this[this.loadSequence.shift()]()
    } else {
    }
  }

  loadModels() {
    TO_LOAD.models.forEach((item) => {
      this.loaders.models.load(item.file, (gltf) => {
        // const group = new Group()
        if (item.position) gltf.scene.position.set(...item.position)
        if (item.scale) gltf.scene.scale.set(item.scale, item.scale, item.scale)
        // group.add(gltf.scene)
        this.assets.models[item.id] = gltf

        // if (item.id === "horse" || item.id === "parrot") {
        //   var basicMaterial = new MeshBasicMaterial({
        //     color: 0xffffff,
        //   })
        //   gltf.scene.traverse((child) => {
        //     if (child.isMesh) {
        //       child.material = basicMaterial
        //     }
        //   })
        // }

        this.modelLoadCount++
        this.checkModels()
      })
    })

    this.loadNext()
  }

  loadSounds() {
    TO_LOAD.sounds.forEach((item) => {
      this.assets.sounds[item.id] = null
      this.loaders.sounds.load(item.file, (buffer) => {
        // console.log("--- sound loaded")
        // console.log("loaded buffer", buffer)
        this.assets.sounds[item.id] = buffer //audio

        this.audioBufferCount++
        this.checkBuffers()
      })
    })
    this.loadNext()
  }

  loadTextures() {
    TO_LOAD.textures.forEach((item) => {
      this.loaders.textures.load(item.file, (texture) => {
        this.assets.textures[item.id] = texture
      })
    })

    this.loadNext()
  }

  getModel(id, deepClone) {
    console.log("--GET MODEL:", id, this.assets.models[id])
    const group = new Group()
    const scene = this.assets.models[id].scene.clone()

    scene.traverse((item) => {
      if (item.isMesh) {
        item.home = {
          position: item.position.clone(),
          rotation: item.rotation.clone(),
          scale: item.scale.clone(),
        }
        if (deepClone) item.material = item.material.clone()
      }
    })

    group.add(scene)
    return { group, scene, animations: this.assets.models[id].animations }
  }

  getTexture(id) {
    // console.log("getting", id, "from", this.assets.textures)
    return this.assets.textures[id]
  }

  getSound(id) {
    // console.log("getting", id, "from", this.assets.sounds)
    return this.assets.sounds[id]
  }

  // setSoundCallback(id, cb) {
  //   console.log(id, this.assets.sounds[id], cb)
  //   if (!this.assets.sounds[id]) this.assets.sounds[id] = cb
  // }
}

const ASSETS = new Assets()

// CRYSTAL

class Crystal {
  constructor(sim, onWhole, onBroken) {
    this.machine = interpret(CrystalMachine)
    this.state = this.machine.initialState.value

    this.wholeCallback = onWhole
    this.brokeCallback = onBroken

    this.model = ASSETS.getModel("crystal")

    this.energy = new CrystalEnergyEmitter(sim)

    this.smashItems = []
    this.beams = []
    this.group = this.model.group
    this.scene = this.model.scene
    this.crystal = null

    this.position = {
      x: 0,
      y: -0.05,
      z: 0.165,
    }

    this.spin = 1
    this.brokenSpin = 0
    this.glitch = 0

    this.elapsedTime = 0

    this.uniforms = {
      uTime: { value: 0 },
      uGlow: { value: 0 },
    }

    this.material = new MeshMatcapMaterial({
      side: DoubleSide,
    })

    this.light = new CrystalLight({ x: 0, y: 0.05, z: 0 }, sim.size)
    this.group.add(this.light.light)

    this.material.matcap = ASSETS.getTexture("crystal-matcap")
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = this.uniforms.uTime
      shader.uniforms.uGlow = this.uniforms.uGlow

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `
    		uniform float uGlow;

    		#include <common>
    	`
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <output_fragment>",
        `#include <output_fragment>

    		

    		vec3 color = mix(gl_FragColor.rgb, vec3(1.0), uGlow);
    		gl_FragColor = vec4(color, gl_FragColor.a);
    	`
      )
    }

    this.model.scene.traverse((item) => {
      if (item.type === "Mesh") {
        item.material = this.material
        if (item.name === "Ruby") {
          this.crystal = item
        } else {
          this.smashItems.push(item)
          item.home = {
            position: item.position.clone(),
            rotation: item.rotation.clone(),
            scale: item.scale.clone(),
          }
          item.random = {
            x: Math.random() * 2 - 1,
            y: Math.random() * 2 - 1,
            z: Math.random() * 2 - 1,
          }
        }
      }
    })

    const beams = [
      {
        x: 0,
        y: Math.PI * 2 * 0,
        z: 0,
      },
      {
        x: 0,
        y: Math.PI * 2 * 0.33,
        z: 0.5,
      },
      {
        x: 0,
        y: Math.PI * 2 * 0.66,
        z: -1,
      },
    ]

    this.beams = beams.map((r) => {
      const plane = new PlaneGeometry(8, 2)
      const material = new ShaderMaterial({
        side: DoubleSide,
        transparent: true,
        vertexShader: `
				
uniform float uSize;
uniform float uTime;


varying vec2 vUv;

void main()
{
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position * (0.1 + uv.x), 1.0);
}
				`,
        fragmentShader: `
				uniform float progress;
uniform bool debug;

varying vec2 vUv;

// #include noise

void main() {

    
    float alpha = (1.0 - smoothstep(0.3, 1.0, vUv.x));
    gl_FragColor.rgb = vec3(1.0, 1.0, 1.0);
    gl_FragColor.a = alpha;
}
`,
      })

      const mesh = new Mesh(plane, material)
      mesh.rotation.set(r.x, r.y, r.z)
      mesh.visible = false
      this.scene.add(mesh)

      return mesh
    })

    this.machine.onTransition((s) => this.onStateChange(s))
    this.machine.start()

    // this.showFull()
  }

  onStateChange = (state) => {
    this.state = state.value

    if (state.changed || this.state === "IDLE") {
      switch (this.state) {
        case "IDLE":
          this.machine.send("start")
          break
        case "INIT":
          this.machine.send("ready")
        case "WHOLE":
          this.showFull()
          this.energy.active = true
          if (this.wholeCallback) this.wholeCallback()
          break
        case "OVERLOADING":
          this.energy.active = false
          SOUNDS.play("glitch")
          this.overloadAnimation()
          break
        case "BREAKING":
          this.showBroken()
          SOUNDS.play("crystal-explode")
          this.explodeAnimation()
          break
        case "BROKEN":
          if (this.brokeCallback) this.brokeCallback()
          break
        case "FIXING":
          this.energy.active = true
          setTimeout(() => SOUNDS.play("crystal-reform"), 200)
          this.rewindAnimation()
          break
      }
    }
  }

  showFull() {
    this.crystal.visible = true
    this.smashItems.forEach((item) => (item.visible = false))
  }

  showBroken() {
    this.crystal.visible = false
    this.smashItems.forEach((item) => (item.visible = true))
  }

  spinDown() {
    gsap.to(this, {
      spin: 0,
      duration: 2.5,
      ease: "power2.inOut",
    })
  }

  spinUp() {
    gsap.to(this, {
      spin: 1,
      duration: 2.5,
      ease: "power2.inOut",
    })
  }

  brokenSpinUp() {
    gsap.to(this, {
      brokenSpin: 1,
      duration: 1,
      ease: "power2.inOut",
    })
  }

  brokenSpinDown() {
    this.brokenSpin = 0
  }

  glitchSpinUp() {
    gsap.to(this, {
      glitch: 1,
      duration: 2,
      ease: "power3.in",
    })
    gsap.to(this.uniforms.uGlow, {
      value: 0.5,
      duration: 4,
      ease: "power2.in",
    })
  }

  glitchSpinDown() {
    this.glitch = 0
    gsap.to(this.uniforms.uGlow, {
      value: 0,
      duration: 1,
      ease: "power2.out",
    })
  }

  overloadAnimation() {
    this.spinDown()
    this.glitchSpinUp()

    gsap.to(this.group.scale, { x: 1.5, z: 1.5, y: 1.5, ease: "power1.in", duration: 4 })

    const tl = gsap.timeline({
      defaults: { duration: 0.4, ease: "power2.inOut" },
      onComplete: () => this.machine.send("break"),
    })

    const rotationOffset = this.group.rotation.y % (Math.PI * 2)

    tl.to(
      this.scene.rotation,
      {
        x: "+=" + Math.PI * 0,
        y: "+=" + Math.PI * 2 * 0.33,
        z: "+=" + Math.PI * 0,
        onComplete: () => (this.beams[0].visible = true),
      },
      1
    )
    tl.to(
      this.scene.rotation,
      {
        x: "+=" + Math.PI * 0,
        y: "+=" + Math.PI * 2 * 0.33,
        z: "+=" + Math.PI * 0,
        onComplete: () => (this.beams[2].visible = true),
      },
      2
    )
    tl.to(
      this.scene.rotation,
      {
        x: "+=" + Math.PI * 0,
        y: "+=" + Math.PI * 2 * 0.33,
        z: "+=" + Math.PI * 0.25,
        onComplete: () => (this.beams[1].visible = true),
      },
      3
    )
    tl.to(this.scene.rotation, {}, 3.5)
  }

  explodeAnimation() {
    const duration = 3
    this.showBroken()
    this.glitchSpinDown()
    this.brokenSpinUp()
    this.beams.forEach((beam) => (beam.visible = false))

    gsap.delayedCall(duration * 0.8, () => {
      this.machine.send("broke")
    })
    this.smashItems.forEach((item) => {
      gsap.to(item.position, {
        x: Math.random() * 10 - 5,
        y: Math.random() * 5 - 1,
        z: Math.random() * 8 - 4,
        ease: "power4.out",
        duration,
      })
      // gsap.to(item.rotation, {
      //   x: Math.random() * 6 - 3,
      //   y: Math.random() * 6 - 3,
      //   z: Math.random() * 6 - 3,
      //   ease: "power4.out",
      //   duration,
      // })
    })
  }

  rewindAnimation() {
    const duration = 2
    this.brokenSpinDown()
    gsap.delayedCall(duration * 0.5, () => {
      if (this.wholeCallback) this.wholeCallback()
    })
    this.spinUp()
    gsap.delayedCall(duration, () => this.machine.send("fixed"))
    gsap.to(this.scene.rotation, { x: 0, y: "+=" + Math.PI * 3, z: 0, ease: "power4.inOut", duration: duration * 1.5 })
    gsap.to(this.group.scale, { x: 1, z: 1, y: 1, ease: "power4.inOut", duration: duration * 1.5 })
    // gsap.to(this.scene.rotation, { x: 0, z: 0, y: "+=" + Math.PI * 3, ease: "power4.inOut", duration: duration * 1.5 })
    this.smashItems.forEach((item) => {
      gsap.to(item.position, {
        ...item.home.position,
        duration,
        ease: "power2.inOut",
      })
      gsap.to(item.rotation, {
        x: item.home.rotation.x,
        y: item.home.rotation.y,
        z: item.home.rotation.z,
        duration,
        ease: "power2.inOut",
      })
    })
  }

  explode() {
    this.machine.send("overload")
  }

  reset() {
    if (this.state === "WHOLE") {
      if (this.wholeCallback) this.wholeCallback()
    } else this.machine.send("fix")
  }

  tick(delta) {
    this.elapsedTime += delta
    this.uniforms.uTime.value = this.elapsedTime

    const float = Math.cos(this.elapsedTime) * 0.015

    this.group.rotation.x = Math.cos(this.elapsedTime) * 0.1 * this.spin
    this.group.rotation.z = Math.cos(this.elapsedTime) * 0.07 * this.spin
    this.group.rotation.y += 0.5 * delta * this.spin

    this.group.position.x = this.position.x
    this.group.position.y = this.position.y + float * this.spin
    this.group.position.z = this.position.z

    if (this.light) this.light.tick(delta, this.elapsedTime)
    if (this.energy) this.energy.tick(delta, this.elapsedTime)

    const rotateFactor = 0.25
    if (this.brokenSpin > 0) {
      this.smashItems.forEach((item) => {
        item.rotation.x += delta * item.random.x * rotateFactor * this.brokenSpin
        item.rotation.y += delta * item.random.y * rotateFactor * this.brokenSpin
        item.rotation.z += delta * item.random.z * rotateFactor * this.brokenSpin
      })
    }

    const glitchAmount = 0.007
    if (this.glitch > 0) {
      this.scene.position.x = (Math.random() - 0.5) * glitchAmount * this.glitch
      this.scene.position.y = (Math.random() - 0.5) * glitchAmount * this.glitch
      this.scene.position.z = (Math.random() - 0.5) * glitchAmount * this.glitch
    }
  }
}

// ENTRANCE

class Entrance {
  constructor(name, points, enterFunc) {
    this.name = name
    this.points = points
    this.enterFunc = enterFunc
  }

  createPathTo(destination, offset, offsetFromDestination) {
    // const waypointCount = 1

    const shift = offsetFromDestination ? { ...destination } : { x: 0, y: 0, z: 0 }

    let waypoints = this.calculateEvenlySpacedVectors({ x: 0.5, y: 0.5, z: 0.5 }, destination, 5)

    // waypoints.push({
    //   x: destination.x,
    //   y: 0.5,
    //   z: destination.z,
    // })

    let newPath = [...this.points, ...waypoints, destination].map((p) => ({
      x: p.x - shift.x,
      y: p.y - shift.y,
      z: p.z - shift.z,
    }))

    const curve = new CatmullRomCurve3(newPath.map((p) => new Vector3(p.x, p.y, p.z)))

    return curve
  }

  calculateEvenlySpacedVectors(center, vector1, numVectors = 2) {
    const angleBetweenVectors = (2 * Math.PI) / numVectors

    const x1 = vector1.x - center.x
    const z1 = vector1.z - center.z
    const radius = Math.sqrt(x1 ** 2 + z1 ** 2)

    const angle1 = Math.atan2(z1, x1)

    const evenlySpacedVectors = []

    for (let i = 1; i <= numVectors; i++) {
      const angle = angle1 + i * angleBetweenVectors
      const vector = {
        x: center.x + radius * Math.cos(angle),
        y: 0.2 + Math.random() * 0.6,
        z: center.z + radius * Math.sin(angle),
      }
      evenlySpacedVectors.push(vector)
    }

    return evenlySpacedVectors
  }

  createDebugMarkers(container, offset) {
    const group = new Group()

    this.points.forEach((p) => {
      const helper = new Mesh(new SphereGeometry(0.01), new MeshBasicMaterial({ color: 0xffffff }))
      helper.position.x = p.x * offset.x
      helper.position.y = p.y * offset.y
      helper.position.z = p.z * offset.z
      group.add(helper)
    })

    container.add(group)
  }

  enter() {
    if (this.enterFunc) this.enterFunc()
  }
}

// LOCATION

class Location {
  #position
  #offset
  #index

  constructor(position, offset, entrances, releaseCallback, markerColor = 0xffffff) {
    this.#position = position
    this.rotation = position.r
    this.#offset = offset
    this.group = new Group()
    this.releaseCallback = releaseCallback
    this.markerColor = markerColor

    this.entranceOptions = entrances.map((e) => e.name)
    this.entrancePaths = {}

    this.energyEmitter = null

    this.init()

    this.createEntrancePaths(entrances)
  }

  init() {
    this.setPosition()
    // this.group.rotation.y = this.rotation
    if (window.DEBUG.locations) {
      const axesHelper = new AxesHelper(0.1)
      axesHelper.rotation.y = this.rotation
      this.group.add(axesHelper)
      const helper = new Mesh(new SphereGeometry(0.01), new MeshBasicMaterial({ color: this.markerColor }))
      this.group.add(helper)
    }
  }

  getRandomEntrance() {
    const entrance = randomFromArray(this.entranceOptions)
    return this.entrancePaths[entrance]
  }

  createEntranceTrail(curve) {
    const pointsCount = 200

    const frenetFrames = curve.computeFrenetFrames(pointsCount, false)
    const points = curve.getSpacedPoints(pointsCount)
    const width = [-0.05, 0.05]

    let point = new Vector3()
    let shift = new Vector3()
    let newPoint = new Vector3()

    let planePoints = []

    width.forEach((d) => {
      for (let i = 0; i < points.length; i++) {
        point = points[i]
        shift.add(frenetFrames.binormals[i]).multiplyScalar(d)
        planePoints.push(new Vector3().copy(point).add(shift))
      }
    })

    const geometry = new PlaneGeometry(0.1, 0.1, points.length - 1, 1).setFromPoints(planePoints)
    const material = new ShaderMaterial({
      vertexShader: `
			
uniform float uSize;
uniform float uTime;


varying vec2 vUv;

void main()
{
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
			`,
      fragmentShader: FragmentShader(`
			uniform float progress;
uniform bool debug;

varying vec2 vUv;

#include noise

void main() {

    float length = 0.2;  

    float strength = 1.0;
    float xRange = 1.0 + length * 2.0;
    strength *= 1.0 - smoothstep(vUv.x - length * 0.5, xRange * progress, xRange * progress - length * 0.5);
    // strength *= step(xRange * progress, vUv.x + length * 0.5 );

    float noiseSmooth = (snoise(vec2((vUv.x) * 5.0, (vUv.y) * 3.0)) + 1.0) / 2.0;
    float noiseStepped = step(0.5, noiseSmooth);

    float debugColor = 0.0;
    if(debug) debugColor = 1.0;

    gl_FragColor.rgb = vec3(0.05 + debugColor * (1.0 - noiseSmooth), 0.05, 0.05);
    gl_FragColor.a = debugColor + strength * noiseSmooth;
}
			`),
      side: DoubleSide,
      transparent: true,
      uniforms: {
        progress: { value: 0.0 },
        debug: { value: window.DEBUG.trail },
      },
    })
    const plane = new Mesh(geometry, material)
    plane.scale.set(this.#offset.x, this.#offset.y, this.#offset.z)
    this.group.add(plane)
    plane.visible = false
    return plane
  }

  createEntrancePaths(entrances) {
    entrances.forEach((entrance) => {
      const curve = entrance.createPathTo(this.#position, this.#offset, true)
      // .map((vec3) => vec3.multiply(new Vector3(this.#offset.x, this.#offset.y, this.#offset.z)))

      const points = curve.getSpacedPoints(30)

      const trail = this.createEntranceTrail(curve)

      this.entrancePaths[entrance.name] = { points, curve, trail, entrance }

      if (window.DEBUG.locations) {
        const geometry = new TubeGeometry(curve, 50, 0.001, 8, false)
        const material = new MeshBasicMaterial({ color: this.markerColor })
        const curveObject = new Mesh(geometry, material)
        curveObject.scale.set(this.#offset.x, this.#offset.y, this.#offset.z)

        // curveObject.rotation.y = -this.rotation

        this.group.add(curveObject)
      }
    })
  }

  setPosition() {
    const p = {
      x: this.#position.x * this.#offset.x,
      y: this.#position.y * this.#offset.y,
      z: this.#position.z * this.#offset.z,
    }
    this.group.position.set(p.x, p.y, p.z)
  }

  add(item) {
    this.group.add(item)
  }

  release() {
    this.releaseCallback(this.#index)
  }

  get x() {
    return this.#position.x
  }

  get y() {
    return this.#position.y
  }

  get z() {
    return this.#position.z
  }

  get position() {
    return this.#position
  }

  set index(newIndex) {
    this.#index = newIndex
  }

  set position(newPosition) {
    this.#position = newPosition
    this.setPosition()
  }

  set x(newX) {
    this.#position.x = newX
    this.setPosition()
  }

  set y(newY) {
    this.#position.y = newY
    this.setPosition()
  }

  set z(newZ) {
    this.#position.z = newZ
    this.setPosition()
  }
}

// PARTICLE SIM

class ParticleSim {
  constructor(settings) {
    this.settings = {
      size: { x: 11, y: 5, z: 12 },
      particles: 5000,
      noiseStrength: 0.8,
      flowStrength: 0.03,
      pixelRatio: 1,
      gridFlowDistance: 1,
      flowDecay: 0.95,
      ...settings,
    }

    this._size = new Vector3(this.settings.size.x, this.settings.size.y, this.settings.size.z)
    const max = Math.max(...this._size.toArray())
    this._size.divideScalar(max)

    this.gridCellCount = this.settings.size.x * this.settings.size.y * this.settings.size.z

    this._grid = new Float32Array(this.gridCellCount * 3)
    this._flow = new Float32Array(this.gridCellCount * 3)
    this._noise = new Float32Array(this.gridCellCount * 3)

    this.offset = new Vector3(
      (this.size.x / this.grid.x) * 0.5,
      (this.size.y / this.grid.y) * 0.5,
      (this.size.z / this.grid.z) * 0.5
    )

    this.startCoords = new Vector3(
      0 - this.offset.x * this.settings.size.x,
      0 - this.offset.y * this.settings.size.y,
      0 - this.offset.z * this.settings.size.z
    )

    this.particleGroups = {
      smoke: {
        count: 1000,
        nextParticle: 0,
        newParticles: false,
        geometry: new BufferGeometry(),
        material: new ShaderMaterial({
          ...DEFAULT_PARTICLE_MATERIAL_SETTINGS,
          fragmentShader: `
					const float spriteSheetCount = 8.0;

uniform sampler2D spriteSheet;

varying float vLife;
varying vec3 vColor;
varying vec3 vRandom;

vec4 getSprite(vec2 uv, float i) {
    float chunkSize = 1.0 / spriteSheetCount;
    return texture( spriteSheet, vec2((chunkSize * i) + uv.x * chunkSize, uv.y) );
}

void main()
{
    if(vLife <= 0.0) discard;

    vec2 uv = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y );

    vec4 tex = getSprite(uv, floor(vRandom.y * spriteSheetCount));
   
    vec3 color = mix(tex.rgb, vec3(0.02, 0.0, 0.0), 0.8 + vRandom.x * 0.2 );
    float strength = tex.a * 1.0 ;

    if(strength < 0.0) strength = 0.0;
 
    float fade = 1.0;
    if(vLife < 0.6) {
        fade = smoothstep(0.0, 0.6, vLife);
    } else {
        fade = 1.0 - smoothstep(0.8, 1.0, vLife);
    }

    gl_FragColor = vec4(color, strength * fade);
}
					`,
          blending: CustomBlending,
          blendDstAlpha: OneFactor,
          blendSrcAlpha: ZeroFactor,
          uniforms: {
            uTime: { value: 0 },
            uGrow: { value: true },
            uSize: { value: 250 * this.settings.pixelRatio },
            spriteSheet: { value: ASSETS.getTexture("smoke-particles") },
          },
        }),
        mesh: null,
        properties: {},
      },
      magic: {
        count: 4000,
        nextParticle: 0,
        newParticles: false,
        geometry: new BufferGeometry(),
        material: new ShaderMaterial({
          ...DEFAULT_PARTICLE_MATERIAL_SETTINGS,
          fragmentShader: `
					#define wtf 0x5f3759df;

const float spriteSheetCount = 7.0;

uniform sampler2D spriteSheet;

varying float vLife;
varying float vType;
varying vec3 vColor;
varying vec3 vRandom;

vec4 getSprite(vec2 uv, float i) {
    float chunkSize = 1.0 / spriteSheetCount;
    return texture( spriteSheet, vec2((chunkSize * i) + uv.x * chunkSize, uv.y) );
}

void main()
{
    if(vLife <= 0.0) discard;

    vec2 uv = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y );
    vec4 tex =  getSprite(uv, vType);

    float strength = tex.r;

    // Diffuse point
    if(vType == 1.0) {
        if(vRandom.r >= 0.5) strength = tex.r;
        else strength = tex.g;
    }

    if(vType == 6.0) {       
        if(vRandom.r <= 0.33) strength = tex.r;
        else if(vRandom.r >= 0.66) strength = tex.g;
        else strength = tex.b;
    }

    vec3 color = mix(vColor, vec3(1.0), vRandom.x * 0.4 );

    float fade = 1.0;
    if(vLife < 0.5) {
        fade = smoothstep(0.0, 0.5, vLife);
    } else {
        fade = 1.0 - smoothstep(0.9, 1.0, vLife);
    }

    gl_FragColor = vec4(color, strength * fade);
}
					
					`,
          blending: AdditiveBlending,
          uniforms: {
            uGrow: { value: false },
            uTime: { value: 0 },
            uSize: { value: 75 * this.settings.pixelRatio },
            spriteSheet: { value: ASSETS.getTexture("magic-particles") },
          },
        }),
        mesh: null,
        properties: {},
      },
    }

    this.particleGroupsArray = Object.keys(this.particleGroups).map((key) => this.particleGroups[key])

    this.particleGroupsArray.forEach((group) => {
      group.mesh = new Points(group.geometry, group.material)
      group.mesh.frustumCulled = false

      // group.mesh.renderOrder = 10000

      PROPERTIES.vec3.forEach((propertyName) => {
        group.properties[propertyName] = new Float32Array(group.count * 3)
      })

      PROPERTIES.float.forEach((propertyName) => {
        group.properties[propertyName] = new Float32Array(group.count)
      })

      group.mesh.position.x -= this.offset.x * this.settings.size.x
      group.mesh.position.y -= this.offset.y * this.settings.size.y
      group.mesh.position.z -= this.offset.z * this.settings.size.z

      group.mesh.scale.set(this._size.x, this._size.y, this._size.z)
      group.mesh.renderOrder = 1

      group.geometry.setAttribute("position", new BufferAttribute(group.properties.position, 3))
      group.geometry.setAttribute("color", new BufferAttribute(group.properties.color, 3))
      group.geometry.setAttribute("scale", new BufferAttribute(group.properties.size, 1))
      group.geometry.setAttribute("life", new BufferAttribute(group.properties.life, 1))
      group.geometry.setAttribute("type", new BufferAttribute(group.properties.type, 1))
      group.geometry.setAttribute("random", new BufferAttribute(group.properties.random, 3))
    })

    // this.nextParticle = 0
    // this.newParticles = false

    this.castParticles = []

    // this.particlesGeometry = new BufferGeometry()
    // this.particlesMaterial = new ShaderMaterial({
    //   depthWrite: false,
    //   blending: AdditiveBlending,
    //   // blending: CustomBlending,
    //   // blendDstAlpha: OneFactor,
    //   // blendSrcAlpha: ZeroFactor,
    //   vertexColors: true,
    //   vertexShader,
    //   fragmentShader,
    //   uniforms: {
    //     uTime: { value: 0 },
    //     uSize: { value: 75 * this.settings.pixelRatio },
    //     spriteSheet: { value: ASSETS.getTexture("magic-particles") },
    //   },
    // })

    // this._particles = new Points(this.particlesGeometry, this.particlesMaterial)
    // this._particles.frustumCulled = false

    // this.particlePosition = new Float32Array(this.settings.particles * 3)
    // this.particleDirection = new Float32Array(this.settings.particles * 3)
    // this.particleRandom = new Float32Array(this.settings.particles * 3)
    // this.particleColor = new Float32Array(this.settings.particles * 3)
    // this.particleType = new Float32Array(this.settings.particles)
    // this.particleType = new Float32Array(this.settings.particles)
    // this.particleSpeed = new Float32Array(this.settings.particles)
    // this.particleSpeedDecay = new Float32Array(this.settings.particles)
    // this.particleForce = new Float32Array(this.settings.particles)
    // this.particleForceDecay = new Float32Array(this.settings.particles)
    // this.particleAcceleration = new Float32Array(this.settings.particles)
    // this.particleLife = new Float32Array(this.settings.particles)
    // this.particleLifeDecay = new Float32Array(this.settings.particles)
    // this.particleSize = new Float32Array(this.settings.particles)

    this.init()
  }

  init() {
    for (let i = 0; i < this._grid.length; i += 3) {
      this._grid[i] = Math.random() * 2 - 1
      this._grid[i + 1] = Math.random() * 2 - 1
      this._grid[i + 2] = Math.random() * 2 - 1
    }

    Object.keys(this.particleGroups).forEach((key) => {
      const group = this.particleGroups[key]
      for (let i = 0; i < group.count; i++) {
        this.createParticle(key)
      }

      for (let i = 0; i < group.properties.random.length; i++) {
        group.properties.random[i] = Math.random()
      }
    })

    // this._particles.position.x -= this.offset.x * this.settings.size.x
    // this._particles.position.y -= this.offset.y * this.settings.size.y
    // this._particles.position.z -= this.offset.z * this.settings.size.z

    // this._particles.scale.set(this._size.x, this._size.y, this._size.z)

    // this.particlesGeometry.setAttribute("position", new BufferAttribute(this.particlePosition, 3))
    // this.particlesGeometry.setAttribute("color", new BufferAttribute(this.particleColor, 3))
    // this.particlesGeometry.setAttribute("scale", new BufferAttribute(this.particleSize, 1))
    // this.particlesGeometry.setAttribute("life", new BufferAttribute(this.particleLife, 1))
    // this.particlesGeometry.setAttribute("type", new BufferAttribute(this.particleType, 1))
    // this.particlesGeometry.setAttribute("random", new BufferAttribute(this.particleRandom, 3))

    this.gridFlowLookup = this.setupGridFlowLookup()
  }

  setupGridFlowLookup() {
    let lookupArray = []
    const d = this.settings.gridFlowDistance

    for (let z = 0; z < this.settings.size.z; z++) {
      for (let y = 0; y < this.settings.size.y; y++) {
        for (let x = 0; x < this.settings.size.x; x++) {
          const position = { x, y, z } //new Vector3(x, y, z)
          let group = []

          for (let _z = position.z - d; _z <= position.z + d; _z++) {
            for (let _y = position.y - d; _y <= position.y + d; _y++) {
              for (let _x = position.x - d; _x <= position.x + d; _x++) {
                const newPosition = { x: _x, y: _y, z: _z }
                if (this.validGridPosition(newPosition)) {
                  group.push(this.getGridIndexFromPosition(newPosition))
                }
              }
            }
          }
          lookupArray.push(group)
        }
      }
    }

    return lookupArray
  }

  getVectorFromArray(array, index) {
    if (typeof array === "string") array = this["_" + array]

    if (array)
      return {
        x: array[index * 3],
        y: array[index * 3 + 1],
        z: array[index * 3 + 2],
      }
    return null
  }

  getGridSpaceFromPosition(position) {
    // position.x *= this.settings.size.x
    // position.y *= this.settings.size.y
    // position.z *= this.settings.size.z
    const gridSpace = {
      x: Math.floor(position.x * this.settings.size.x),
      y: Math.floor(position.y * this.settings.size.y),
      z: Math.floor(position.z * this.settings.size.z),
    }

    return gridSpace
  }

  updateArrayFromVector(array, index, vector) {
    if (typeof array === "string") array = this["_" + array]
    // else

    // console.logLimited(vector)
    if (array) {
      array[index * 3] = vector.x !== undefined ? vector.x : vector.r
      array[index * 3 + 1] = vector.y !== undefined ? vector.y : vector.g
      array[index * 3 + 2] = vector.z !== undefined ? vector.z : vector.b
    } else {
      console.logLimited("invalid array")
    }
  }

  getGridIndexFromPosition(position) {
    let index = position.x
    index += position.y * this.settings.size.x
    index += position.z * this.settings.size.x * this.settings.size.y

    return index
  }

  validGridPosition(position) {
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      return false
    }

    if (position.x < 0 || position.y < 0 || position.z < 0) {
      return false
    }

    if (
      position.x >= this.settings.size.x ||
      position.y >= this.settings.size.y ||
      position.z >= this.settings.size.z
    ) {
      return false
    }

    return true
  }

  getGridSpaceDirection(position, source = "grid") {
    if (!this.validGridPosition(position)) {
      return null
    }

    let index = this.getGridIndexFromPosition(position)

    const direction = this.getVectorFromArray(this[`_${source}`], index)

    return direction
  }

  // getGridSpeed(position) {
  //   if (!this.validGridPosition(position)) {
  //     return 0
  //   }

  //   let index = this.getGridIndexFromPosition(position)

  //   return this._speed[index]
  // }

  getSurroundingGrid(index) {
    const surrounding = this.gridFlowLookup[index]

    const toReturn = []
    for (let i = 0; i < surrounding.length; i++) {
      const j = surrounding[i]
      const direction = { x: this._grid[j * 3], y: this._grid[j * 3 + 1], z: this._grid[j * 3 + 2] }
      toReturn.push({
        x: direction.x,
        y: direction.y,
        z: direction.z,
        // speed: this._speed[j],
      })
    }

    return toReturn
  }

  getGridCoordsFromIndex(index) {
    const z = Math.floor(index / (this.settings.size.z * this.settings.size.y))
    const y = Math.floor((index - z * this.settings.size.x * this.settings.size.y) / this.settings.size.x)
    const x = index % this.settings.size.x

    return { x, y, z }
  }

  step(delta, elapsedTime) {
    for (let i = 0; i < this.gridCellCount; i++) {
      // NOISE
      //
      // For each cell we update the noise direction.

      const coords = this.getGridCoordsFromIndex(i)

      const t = elapsedTime * 0.05

      const nc = {
        x: coords.x * 0.05 + t,
        y: coords.y * 0.05 + t,
        z: coords.z * 0.05 + t,
      }

      const noiseX = noise3D(nc.x, nc.y, nc.z)
      const noiseY = noise3D(nc.y, nc.z, nc.x)
      const noiseZ = noise3D(nc.z, nc.x, nc.y)

      const noise = vector.normalize({
        x: Math.cos(noiseX * Math.PI * 2),
        y: Math.sin(noiseY * Math.PI * 2),
        z: Math.cos(noiseZ * Math.PI * 2),
      })

      // FLOW
      //
      // For each cell, record the average direction of the
      // surrounding cells

      const surroundingPositions = this.getSurroundingGrid(i)
      // surroundingPositions.push(vector.multiplyScalar(this.getGridSpaceDirection(coords), 0.1))
      const sum = vector.multiplyScalar(noise, this.settings.noiseStrength)

      for (let j = 0; j < surroundingPositions.length; j++) {
        const direction = surroundingPositions[j]

        sum.x += direction.x
        sum.y += direction.y
        sum.z += direction.z
      }

      const average = {
        x: sum.x / surroundingPositions.length,
        y: sum.y / surroundingPositions.length,
        z: sum.z / surroundingPositions.length,
      }

      // Save the FLOW and Noise values. We don't
      // apply them the grid yet.

      this.updateArrayFromVector("flow", i, average)
      this.updateArrayFromVector("noise", i, noise)
    }

    // Once we have the FLOW and NOISE for the whole
    // grid we now go back through and apply the changes

    for (let i = 0; i < this._grid.length; i++) {
      // Combine the NOISE with the FLOW based on the noiseStrength
      // const flowNoise = this._flow[i] + this._noise[i] * this.settings.noiseStrength

      // Add the new NOISE+FLOW value to the grid.
      this._grid[i] += this._flow[i] * this.settings.flowStrength
    }

    // PARTICLES

    this.particleGroupsArray.map((group) => {
      // console.log("group", group)
      const { life, lifeDecay, position, direction, force, forceDecay, speed, speedDecay, acceleration } =
        group.properties

      for (let i = 0; i < group.count; i++) {
        // We only update particles that have a life more than 0.

        if (life[i] > 0) {
          let particlePosition = this.getVectorFromArray(position, i)
          let particleDirection = this.getVectorFromArray(direction, i)
          const gridSpace = this.getGridSpaceFromPosition(particlePosition)
          let gridDirection = this.getGridSpaceDirection(gridSpace)

          if (gridDirection) {
            particleDirection = vector.lerpVectors(
              particleDirection,
              vector.normalize(gridDirection),
              1 - Math.max(0, Math.min(1, force[i]))
            )
          }

          const move = vector.multiplyScalar(particleDirection, delta ? delta * speed[i] : 0.01)

          particlePosition = vector.add(particlePosition, move)

          // Bounce off edges
          AXIS.forEach((xyz) => {
            if (particlePosition[xyz] < 0 || particlePosition[xyz] > 1) {
              particlePosition[xyz] = particlePosition[xyz] < 0 ? 0 : 1
              particleDirection[xyz] *= -1
            }
          })

          this.updateArrayFromVector(position, i, particlePosition)
          this.updateArrayFromVector(direction, i, vector.normalize(particleDirection))
          // this.updateArrayFromVector("grid", i, particleDirection)
          // this.updateGridSpace(gridSpace, particleDirection)
          const gridIndex = this.getGridIndexFromPosition(gridSpace)
          if (gridDirection) {
            // console.log("force", vector.multiplyScalar(particleDirection, this.particleForce[i]))
            const newGridDirection = vector.add(
              gridDirection,
              vector.multiplyScalar(particleDirection, force[i] * 0.05)
            )

            this.updateArrayFromVector("grid", gridIndex, newGridDirection)
            speed[i] += vector.length(newGridDirection) * acceleration[i] * delta
            if (speed[i] > 1) speed[i] = 1
          }

          speed[i] -= speedDecay[i] * delta
          force[i] -= forceDecay[i] * delta
          life[i] -= lifeDecay[i] * delta
          if (speed[i] < 0.015) speed[i] = 0.015
          if (force[i] < 0) force[i] = 0
          if (life[i] < 0) life[i] = 0
        }
      }

      group.material.uniforms.uTime.value = elapsedTime

      group.geometry.attributes.position.needsUpdate = true
      group.geometry.attributes.life.needsUpdate = true

      if (group.newParticles) {
        group.geometry.attributes.scale.needsUpdate = true
        group.geometry.attributes.color.needsUpdate = true
        group.geometry.attributes.type.needsUpdate = true
        group.newParticles = false
      }
    })

    // console.logLimited(this.settings.flowDecay * delta, delta)
    for (let i = 0; i < this._grid.length; i++) {
      this._grid[i] *= this.settings.flowDecay //* delta
    }
  }

  getRandomPosition() {
    return {
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
    }
  }

  getRandomDirection() {
    return {
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: Math.random() * 2 - 1,
    }
  }

  // setParticleMoving(index, position, direction, speed, force) {
  //   this.updateArrayFromVector(this.particlePosition, index, position)
  //   this.updateArrayFromVector(this.particleDirection, index, direction)
  //   this.particleSpeed[index] = speed
  //   this.particleForce[index] = force
  // }

  createParticle(groupID, settings) {
    const defaults = {
      color: { r: 1, g: 1, b: 1 },
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: 0 },
      speed: 0,
      speedDecay: 0.6,
      force: 0,
      forceDecay: 0.1,
      life: 0,
      lifeDecay: 0.6,
      scale: 0.1,
      style: PARTICLE_STYLES.soft,
      acceleration: 0.1,
      casted: false,
    }

    const particleSettings = {
      ...defaults,
      ...settings,
    }

    const group = this.particleGroups[groupID]

    if (particleSettings.casted) this.castParticles.push(group.nextParticle)

    const {
      position,
      direction,
      color,
      speed,
      speedDecay,
      force,
      forceDecay,
      life,
      lifeDecay,
      size,
      type,
      acceleration,
    } = group.properties

    this.updateArrayFromVector(position, group.nextParticle, particleSettings.position)
    this.updateArrayFromVector(direction, group.nextParticle, particleSettings.direction)
    this.updateArrayFromVector(color, group.nextParticle, particleSettings.color)
    speed[group.nextParticle] = particleSettings.speed
    speedDecay[group.nextParticle] = particleSettings.speedDecay
    force[group.nextParticle] = particleSettings.force
    forceDecay[group.nextParticle] = particleSettings.forceDecay
    life[group.nextParticle] = particleSettings.life
    lifeDecay[group.nextParticle] = particleSettings.lifeDecay
    size[group.nextParticle] = particleSettings.scale
    type[group.nextParticle] = particleSettings.style
    acceleration[group.nextParticle] = particleSettings.acceleration

    const createdParticleIndex = group.nextParticle
    group.nextParticle++
    group.newParticles = true

    if (group.nextParticle >= group.count) group.nextParticle = 0

    return createdParticleIndex
  }

  getParticles(groupID) {
    const group = this.particleGroups[groupID]
    if (!group) return null
    return group.mesh
  }

  getParticlesProperties(groupID, prop) {
    const group = this.particleGroups[groupID]
    if (!group) return null
    return group.properties[prop]
  }

  setParticleProperty(group, index, property, value) {
    const properies = this.particleGroups[group].properties
    const vectors = ["position", "direction", "color"]
    if (vectors.indexOf(property) >= 0) this.updateArrayFromVector(properies[property], index, value)
    else properies[property][index] = value
  }

  get grid() {
    return { ...this.settings.size, points: this._grid.length / 3 }
  }

  get size() {
    return this._size
  }

  get particleMeshes() {
    return this.particleGroupsArray.map((group) => group.mesh)
  }

  // get particles() {
  //   return this._particles
  // }
}

// ROOM

class Room {
  constructor() {
    this.group = new Group()
    this.group.scale.set(0.7, 0.72, 0.7)
    this.group.position.set(0, -0.03, -0.12)
    this.paused = false

    this.uniforms = []
    this.items = {
      "trapdoor-door": null,
      "door-right": null,
      "sub-floor": null,
      bookshelf: null,
    }

    this.afterCompile = null

    this.allItems = []
    this.vortexItems = []

    const room = ASSETS.getModel("room")
    this.group.add(room.group)
    this.scene = room.scene

    this.skirt = new Mesh(new PlaneGeometry(2, 1), new MeshBasicMaterial({ color: new Color("#000000") }))
    this.skirt.position.set(0, -0.77, 0.9)
    this.group.add(this.skirt)

    const vortexGeometry = new ConeGeometry(0.7, 1, 100, 1, true, Math.PI)
    this.vortexMaterial = new ShaderMaterial({
      vertexShader: `
			
uniform float uSize;
uniform float uTime;


varying vec2 vUv;
varying vec3 vNormal;

void main()
{
    vUv = uv;
    vNormal = normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
			`,
      fragmentShader: FragmentShader(`
			uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;

#include noise




void main() {

		// float fade = smoothstep(0.6, 1.0, 1.0 - vUv.y) ;
		float fade =  vUv.y ;
		float noise = snoise(vec2(vUv.x + vUv.y + uTime * 0.2, vUv.y - uTime * 0.5) * 6.0) ;
		noise = 0.2 + smoothstep(0.0, 2.0, noise + 1.0) * 0.8;
		float fineNoise = snoise(vec2(vUv.x, vUv.y * uTime)) ;
    gl_FragColor = vec4(vec3(fineNoise * 0.8, 1.0, fineNoise * 0.8) * noise * fade, 1.0);
}

`),
      side: DoubleSide,
      uniforms: {
        uTime: { value: 0 },
      },
      // depthTest: false,
      // depthWrite: false,
    })

    this.vortex = new Mesh(vortexGeometry, this.vortexMaterial)
    this.vortex.position.set(0, -0.77, 0.165)
    this.vortex.rotation.x = Math.PI
    this.vortex.visible = false
    this.group.add(this.vortex)

    room.scene.traverse((item) => {
      /* 
        We want the shader to compile before the game starts. 
        We take a bit of a hit on performance on zoomed in scenes 
        but most of the time the whole room is in view anyways.
      */
      item.frustumCulled = false

      if (this.items[item.name] !== undefined) {
        const object = item
        this.items[item.name] = {
          object,
          uniforms: {},
          originalPosition: { x: object.position.x, y: object.position.y, z: object.position.z },
          originalRotation: { x: object.rotation.x, y: object.rotation.y, z: object.rotation.z },
        }
      }

      if (item.type === "Mesh") {
        this.allItems.push(item)

        item.home = {
          position: item.position.clone(),
          rotation: item.rotation.clone(),
          scale: item.scale.clone(),
        }

        const itemWorldPos = new Vector3()
        item.getWorldPosition(itemWorldPos)
        const distance = 0.3
        const vortexable =
          item.name !== "sub-floor" && Math.abs(itemWorldPos.x) < distance && Math.abs(itemWorldPos.z) < distance

        if (vortexable) {
          this.vortexItems.push({
            worldPosition: itemWorldPos,
            distance: Math.abs(itemWorldPos.x) + Math.abs(itemWorldPos.z),
            item,
          })
        }

        item.pointsUvs = true

        // this.meshes.push(item)

        item.material.defines.USE_UV = ""

        item.material.onBeforeCompile = (shader) => {
          const uniform = { value: 0 }
          this.uniforms.push(uniform)

          shader.uniforms.progress = uniform
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <common>",
            `
            uniform float progress;
            // varying vec2 vUv;
            #include <common>
            `
          )
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <output_fragment>",
            `#include <output_fragment>

              // float noise = snoise(vUv);
             
              vec3 blackout = mix(vec3(0.0), gl_FragColor.rgb, progress);

              gl_FragColor = vec4(blackout, gl_FragColor.a);
            `
          )

          if (this.afterCompile) {
            this.afterCompile()
            this.afterCompile = null
          }
        }
      }
    })
  }

  show(amount = 1) {
    const duration = 2.5

    this.scene.visible = true

    gsap.killTweensOf(this.uniforms)
    gsap.to(this.uniforms, {
      value: amount,
      ease: "power1.in",
      duration,
    })
  }

  hide(instant = false) {
    console.log("HIDE ROOM")
    const duration = instant ? 0 : 1.5
    gsap.killTweensOf(this.uniforms)
    gsap.to(this.uniforms, {
      value: 0.0,
      duration,
      onComplete: () => {
        this.scene.visible = false
      },
    })
  }

  showVortex(cb) {
    const duration = 1

    this.vortexMaterial.uniforms.uTime.value = 0
    this.vortex.visible = true
    gsap.fromTo(this.vortex.scale, { y: 0.4 }, { y: 1, duration, delay: 0.5 })
    const getRandomAngle = () => Math.random() * (Math.PI * 0.5) - Math.PI * 0.25

    SOUNDS.play("portal")
    setTimeout(() => {
      SOUNDS.play("crumble")
    }, 300)

    // gsap.fromTo(
    //   this.vortexPlaneMaterial.uniforms.uProgress,
    //   { value: 0 },
    //   { delay: 0.5, value: 1, duration: duration * 5 }
    // )
    // gsap.to(this.vortexPlane.rotation, { delay: 0.5, z: "+=2", duration: duration * 5, ease: "none" })

    // const getRandomAngle = () => 0.2
    this.items["sub-floor"].object.visible = false
    for (let i = 0; i < this.vortexItems.length; i++) {
      const obj = this.vortexItems[i]
      gsap.to(obj.item.position, {
        x: "*= 1.5",
        z: "-=0.5",
        y: obj.item.name === "pedestal" ? "-=5" : "-=0",
        delay: obj.distance * 1.2,
        duration,
        ease: "power4.in",
      })
      // gsap.to(obj.item.rotation, {
      //   z: getRandomAngle(),

      //   delay: obj.distance * 1.5,
      //   duration,
      //   ease: "power3.in",
      // })
      gsap.to(obj.item.scale, {
        x: 0,
        y: 0,
        z: 0,

        delay: obj.distance * 1.5,
        duration,
        ease: "power3.in",
      })
    }

    gsap.delayedCall(duration * 2, () => {
      if (cb) cb()
    })
  }

  hideVortex(cb) {
    const duration = 0.6
    let longestDelay = 0

    SOUNDS.play("reform")

    for (let i = 0; i < this.vortexItems.length; i++) {
      const obj = this.vortexItems[i]
      const delay = Math.max(0, 0.4 - obj.distance * 0.5)

      longestDelay = Math.max(longestDelay, delay)
      const values = ["position", "rotation", "scale"]
      values.forEach((type) => {
        gsap.to(obj.item[type], {
          x: obj.item.home[type].x,
          y: obj.item.home[type].y,
          z: obj.item.home[type].z,
          delay,
          duration,
          ease: "power4.out",
        })
      })
    }

    gsap.delayedCall(duration + longestDelay, () => {
      this.items["sub-floor"].object.visible = true
      this.vortex.visible = false
      if (cb) cb()
    })
  }

  trapdoorEnter = () => {
    const tl = gsap.timeline()
    const item = this.items["trapdoor-door"]
    tl.to(item.object.rotation, { x: item.originalRotation.x - Math.PI * 0.5, ease: "power2.out", duration: 0.4 })
    tl.to(item.object.rotation, {
      onStart: () => {
        setTimeout(() => SOUNDS.play("trapdoor-close"), 300)
      },
      x: item.originalRotation.x,
      ease: "bounce",
      duration: 0.9,
    })
  }

  doorEnter = () => {
    const tl = gsap.timeline()
    const item = this.items["door-right"]
    tl.to(item.object.rotation, { z: item.originalRotation.z + Math.PI * 0.7, ease: "none", duration: 0.3 })
    tl.to(item.object.rotation, { z: item.originalRotation.z, ease: "elastic", duration: 2.5 })
  }

  add(item) {
    this.group.add(item)
  }

  pause() {
    this.paused = true
    this.skirt.visible = false
  }

  resume() {
    this.paused = false
    this.skirt.visible = true
  }

  tick(delta, elapsedTime) {
    // console.log("tick")
    this.vortexMaterial.uniforms.uTime.value += delta
  }
}

// SCREENS

class Screens {
  constructor(appElement, machine) {
    this.body = document.body
    this.screensElement = this.body.querySelector(".screens")
    this.spellsInfoElement = document.querySelector(".spells")
    this.appElement = appElement
    this.machine = machine
    this.state = null

    this.spellCornerScreens = ["SETUP_GAME", "GAME_RUNNING", "ENDLESS_MODE", "SPECIAL_SPELL", "ENDLESS_SPECIAL_SPELL"]
    this.spellDetailScreens = ["INSTRUCTIONS_SPELLS", "SPELL_OVERLAY", "ENDLESS_SPELL_OVERLAY"]

    this.setupButtons()
  }

  setupButtons() {
    const buttons = [...this.appElement.querySelectorAll("[data-send]")]
    buttons.forEach((button) => {
      if (button.dataset.send) {
        button.addEventListener("click", () => this.machine.send(button.dataset.send))
      }
    })
  }

  update(newState) {
    this.state = newState
    this.appElement.dataset.state = this.state

    let delay = 1
    let screen = this.screensElement.querySelector(`[data-screen="${this.state}"]`)

    if (screen) {
      console.log("screen", screen)
      const fades = screen.querySelectorAll("[data-fade]")
      gsap.fromTo(
        fades,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, delay, duration: 1, stagger: 0.1, ease: "power2.out" }
      )
    }

    const state = Flip.getState("[data-flip-spell]")

    this.spellsInfoElement.classList[this.spellCornerScreens.includes(this.state) ? "add" : "remove"]("corner")
    this.spellsInfoElement.classList[this.spellDetailScreens.includes(this.state) ? "add" : "remove"]("full")

    const flipDelay = this.state === "INSTRUCTIONS_SPELLS" ? 1.5 : 0.6

    Flip.from(state, {
      duration: 0.8,
      ease: "power2.inOut",
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, y: 30 },
          { duration: 1, y: 0, delay: flipDelay, stagger: 0.1, opacity: 1, ease: "power2.out" }
        ),
      onLeave: (elements) => gsap.fromTo(elements, { opacity: 1 }, { opacity: 0 }),
      // absolute: true,
    })
  }
}

// SIM VIZ

class SimViz {
  constructor(stage, sim, showDirection = true, showNoise = true) {
    this.stage = stage
    this.sim = sim

    this.container = new Group()
    this.stage.add(this.container)

    const box = new Box3()
    box.setFromCenterAndSize(new Vector3(0, 0, 0), this.sim.size)

    const helper = new Box3Helper(box, 0xffffff)
    this.container.add(helper)

    let x = 0
    let y = 0
    let z = 0
    this.directionArrows = []
    this.noiseArrows = []

    const offset = this.sim.offset

    for (let i = 0; i < this.sim.grid.points; i++) {
      const gridSpace = new Vector3(x, y, z)
      const dir = this.sim.getGridSpaceDirection(gridSpace)
      // dir.normalize();

      const origin = new Vector3(
        (x / this.sim.grid.x) * this.sim.size.x - this.sim.size.x * 0.5,
        (y / this.sim.grid.y) * this.sim.size.y - this.sim.size.y * 0.5,
        (z / this.sim.grid.z) * this.sim.size.z - this.sim.size.z * 0.5
      )

      origin.add(offset)
      const length = 0.05

      if (showDirection) {
        const directionArrowHelper = new ArrowHelper(dir, origin, length, 0xffff00, 0.02, 0.01)
        this.directionArrows.push({ helper: directionArrowHelper, gridSpace })
        this.container.add(directionArrowHelper)
      }

      if (showNoise) {
        const noiseArrowHelper = new ArrowHelper(dir, origin, length, 0xff0000, 0.02, 0.01)
        this.noiseArrows.push({ helper: noiseArrowHelper, gridSpace })
        this.container.add(noiseArrowHelper)
      }

      x++
      if (x >= this.sim.grid.x) {
        x = 0
        y++

        if (y >= this.sim.grid.y) {
          y = 0
          z++
        }
      }
    }

    // this.stage.addTickFunction(() => this.tick())
  }

  tick() {
    for (const arrow of this.directionArrows) {
      // console.log('arrow', arrow)

      const direction = this.sim.getGridSpaceDirection(arrow.gridSpace)
      arrow.helper.setDirection(vector.normalize(direction))
      arrow.helper.setLength(Math.max(0.01, vector.length(direction) * 0.1))
    }

    for (const arrow of this.noiseArrows) {
      // console.log('arrow', arrow)
      arrow.helper.setDirection(this.sim.getGridSpaceDirection(arrow.gridSpace, "noise"))
    }
  }
}

// SPELL CASTER

class SpellCaster {
  constructor(sim, container, stage, DOMElement, onSpellSuccess, onSpellFail) {
    this.machine = interpret(CasterMachine)
    this.state = this.machine.initialState.value

    this.sim = sim
    this.container = container
    this.stage = stage

    this.successCallback = onSpellSuccess
    this.failCallback = onSpellFail
    this.DOMElement = DOMElement
    this.currentTouchId = null

    this.pathElement = document.querySelector("#spell-path")
    this.pathPointsGroup = document.querySelector("#spell-points")
    this.spellsInfoElement = document.querySelector(".spells")
    this.chargingNotification = document.querySelector(".charging-notification")
    this.chargingNotificationSpellName = this.chargingNotification.querySelector(".charging-spell")

    this.rechargeNotificationTimeout = null
    
    this.noRecharge = false

    this.spellStates = {
      arcane: {
        charge: 0,
        rechargeRate: 0.25,
        svg: this.spellsInfoElement.querySelector("#spell-svg-viz-arcane"),
        path: this.spellsInfoElement.querySelector("#spell-path-viz-arcane"),
      },
      fire: {
        charge: 0,
        rechargeRate: 0.09,
        svg: this.spellsInfoElement.querySelector("#spell-svg-viz-fire"),
        path: this.spellsInfoElement.querySelector("#spell-path-viz-fire"),
      },
      vortex: {
        charge: 0,
        rechargeRate: 0.05,
        svg: this.spellsInfoElement.querySelector("#spell-svg-viz-vortex"),
        path: this.spellsInfoElement.querySelector("#spell-path-viz-vortex"),
      },
    }

    this.spellNames = Object.keys(this.spellStates)
    this.allowed = this.spellNames

    if (window.DEBUG.casting) {
      document.querySelector("#spell-stats").style.display = "block"
      document.querySelector("#spell-helper").style.display = "block"
    }

    this.spellPath = []
    this.spells = []
    this.emitter = new CastEmitter(sim)
    this.raycaster = new Raycaster()
    this.DOMElementSize = { width: 0, height: 0 }
    this.emitPoint = { x: 0, y: 0, z: 0 }

    this.touchOffset = { x: 0, y: 0 }

    this.init()
  }

  init() {
    this.clearSpell()
    this.machine.onTransition((s) => this.onStateChange(s))
    this.machine.start()

    this.pointLight = new PointLight(new Color("#ffffff"), 0, 1.2)
    this.pointLight.castShadow = true
    this.container.add(this.pointLight)

    this.pointLight.position.x = 0.5
    this.pointLight.position.y = 0.5
    this.pointLight.position.z = 1

    this.hitPlane = new Mesh(
      new PlaneGeometry(this.sim.size.x, this.sim.size.y),
      new MeshBasicMaterial({
        color: 0x248f24,
        alphaTest: 0,
        wireframe: true,
        visible: window.DEBUG.casting,
      })
    )
    this.hitPlane.position.set(this.sim.size.x * 0.5, this.sim.size.y * 0.5, this.sim.size.z * 0.95)

    this.spellPlane = new Mesh(
      new PlaneGeometry(1, 1),
      new ShaderMaterial({
        // depthWrite: false,
        transparent: true,
        vertexShader: `
				
uniform float uTime;


varying vec2 vUv;

void main()
{
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
				`,
        fragmentShader: FragmentShader(`
				#define PI 3.141592
#define PI_2 6.283185

uniform sampler2D uTexture;
uniform float uTime;
uniform float uProgress;
uniform vec3 uColor;
uniform float uSeed; 


varying vec2 vUv;

float noiseSize = 30.0 ;
float fadeLength = 3.0;

#include noise

float swipe(vec2 uv, float progress, float direction) {
    float x = ((PI_2 + (fadeLength * 2.0)) * progress) - fadeLength;
    float angle = (PI - atan(uv.y - 0.5, uv.x - 0.5));
    return smoothstep(x + fadeLength, x - fadeLength, angle * direction) * 0.5;
}

vec2 rotatedUV(float angle, vec2 uv) {
    mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    return rotationMatrix * uv;
}

vec4 sampleRotatedTexture(float angle, vec2 texCoord)
{
    // Translate texture coordinates to center
    vec2 centeredTexCoord = texCoord - vec2(0.5);

    // Create a 2x2 rotation matrix
    mat2 rotationMatrix = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));

    // Apply rotation to centered texture coordinates
    vec2 rotatedTexCoord = rotatedUV(angle, centeredTexCoord);

    // Translate texture coordinates back to original position
    rotatedTexCoord += vec2(0.5);

    // Sample the texture
    return texture(uTexture, rotatedTexCoord);
}

void main()
{
    if(uProgress >= 1.0) discard;

    // float a = noise * shape.r;

    float left = uProgress * 1.0; 
    float right = -uProgress * 0.5;

    float leftNoise = step((snoise((vUv.xy + uSeed )* noiseSize) + 1.0) / 2.0, smoothstep(0.0, 0.9, uProgress));
    float rightNoise = step((snoise((vUv.xy + uSeed )* noiseSize) + 1.0) / 2.0, smoothstep(0.3, 0.9, uProgress));
    // Sample the texture twice with different rotations
    vec4 leftTex = sampleRotatedTexture(left, vUv);
    vec4 rightTex = texture(uTexture, vUv);

    
    float fade = 1.0 - smoothstep(0.7, 1.0, uProgress);
    fade *= smoothstep(0.0, 0.1, uProgress);

    float red = leftTex.r * leftNoise; //tex.r;
    float green = rightTex.g * rightNoise;
    float blue = rightTex.b;

    float alpha = min(1.0, red + green);
    vec3 color = mix(vec3(1.0), uColor, smoothstep(0.5, 0.7, uProgress));

    gl_FragColor = vec4(color * alpha,  alpha * fade);
    // gl_FragColor = vec4(vec3(rightNoise, 0.0 ,0.0), 1.0);
}
				`),
        // blending: CustomBlending,
        // blendDstAlpha: OneFactor,
        // blendSrcAlpha: ZeroFactor,
        uniforms: {
          uSeed: { value: Math.random() },
          uColor: { value: new Color("#E1BBFF") },
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uTexture: { value: ASSETS.getTexture("spell-arcane") },
        },
      })
    )
    this.spellPlane.position.set(this.sim.size.x * 0.5, this.sim.size.y * 0.5, this.sim.size.z * 0.93)
    this.spellPlane.visible = false

    this.container.add(this.hitPlane)
    this.container.add(this.spellPlane)

    // setup viz
    this.spellNames.forEach((spell) => {
      const length = this.spellStates[spell].path.getTotalLength()
      this.spellStates[spell].svg.style.setProperty("--length", length)
    })

    this.onResize()
    this.setupSpells()
  }

  onResize() {
    this.DOMElementSize = {
      width: this.DOMElement.clientWidth,
      height: this.DOMElement.clientHeight,
    }

    const bbox = this.DOMElement.getBoundingClientRect()
    this.touchOffset.x = bbox.left
    this.touchOffset.y = bbox.top
  }

  setupSpells() {
    this.spells = [...document.querySelectorAll(".spell")].map((pathElement) => {
      // const pathElement = group.querySelector("path")
      // console.log(pathElement)
      const pathString = pathElement.getAttribute("d")
      const spellType = pathElement.dataset.spell
      const spellID = pathElement.id
      const group = document.querySelector(`[data-spell-shape="${spellID}"]`)
      // const

      const points = pathString.replace("M", "").split("L")
      const path = this.getEvenlySpacedPoints(
        points.map((p) => {
          const arr = p.split(" ")
          return { x: Number(arr[0]), y: Number(arr[1]) }
        })
      )

      return {
        scoreElement: group.querySelector(".score"),
        groupElement: group,
        type: spellType,
        id: spellID,
        path,
        lengths: {
          x: this.getPathLengths(path, "x"),
          y: this.getPathLengths(path, "y"),
        },
      }
    })

    // console.log("spells = ", this.spells)
  }

  getLength(pointA, pointB) {
    const deltaX = pointA.x - pointB.x
    const deltaY = pointA.y - pointB.y
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  getPathLengths(path, type) {
    //const checks = [path[0], path[path.length - 1]]
    // const start = { x: 0, y: 0 }

    const lengths = []
    for (let i = 0; i < path.length; i++) {
      const point = path[i]
      lengths.push(this.getLength({ ...point, [type]: 0 }, point))
    }
    return lengths
  }

  clearSpell() {
    this.spellPath = []
  }

  addSpellPathPoint(x, y, clearBoundingBox = false) {
    this.spellPath.push({ x, y })

    let mouse = new Vector2()

    mouse.x = (x / this.DOMElementSize.width) * 2 - 1
    mouse.y = -(y / this.DOMElementSize.height) * 2 + 1

    this.raycaster.setFromCamera(mouse, this.stage.camera)
    var intersects = this.raycaster.intersectObject(this.hitPlane)

    if (intersects.length) {
      const uv = intersects[0].uv

      this.newPoint = {
        x: uv.x,
        y: uv.y,
        z: this.hitPlane.position.z,
      }

      if (clearBoundingBox) this.resetBoundingBox(this.newPoint)
      else this.addToBoundingBox(this.newPoint)

      this.emitter.move(this.newPoint)
      this.pointLight.position.x = this.newPoint.x * this.sim.size.x
      this.pointLight.position.y = this.newPoint.y * this.sim.size.y
      this.pointLight.position.z = this.newPoint.z * this.sim.size.z
    }
  }

  animateSpellPlane() {
    gsap.killTweensOf(this.spellPlane.material.uniforms.uProgress)
    gsap.killTweensOf(this.spellPlane.scale)

    this.spellPlane.visible = true

    this.spellPlane.position.x = this.boundingBox.center.x * this.sim.size.x
    this.spellPlane.position.y = this.boundingBox.center.y * this.sim.size.y
    this.spellPlane.scale.x = this.boundingBox.scale.value
    this.spellPlane.scale.y = this.boundingBox.scale.value

    this.spellPlane.material.uniforms.uSeed.value = Math.random()

    const duration = 2

    gsap.fromTo(
      this.spellPlane.material.uniforms.uProgress,
      { value: 0 },
      { duration, value: 1, onComplete: () => (this.spellPlane.visible = false) }
    )

    gsap.fromTo(
      this.spellPlane.scale,
      { x: this.boundingBox.scale.value + 0.1, y: this.boundingBox.scale.value + 0.1 },
      { x: this.boundingBox.scale.value, y: this.boundingBox.scale.value, duration: duration * 0.9, ease: "power2.out" }
    )

    gsap.fromTo(
      this.spellPlane.rotation,
      { z: (Math.random() > 0.5 ? -Math.PI : Math.PI) * 0.5 },
      { z: 0, duration: duration, ease: "power2.out" }
    )

    // gsap.fromTo(this.spellPlane.position, { z: 0.95 }, { z: 0.1, duration, ease: "power4.in" })
  }

  addToBoundingBox(point) {
    const { topLeft, bottomRight, center, scale } = this.boundingBox
    
    if (!point) point = { x: 0.5, y: 0.5 }
    if(point.x === undefined) point.x = 0.5
    if(point.y === undefined) point.y = 0.5
    
    topLeft.x = Math.min(topLeft.x, point.x)
    topLeft.y = Math.min(topLeft.y, point.y)
    bottomRight.x = Math.max(bottomRight.x, point.x)
    bottomRight.y = Math.max(bottomRight.y, point.y)
    center.x = topLeft.x + (bottomRight.x - topLeft.x) * 0.5
    center.y = topLeft.y + (bottomRight.y - topLeft.y) * 0.5
    scale.value =
      Math.max((bottomRight.x - topLeft.x) * this.sim.size.x, (bottomRight.y - topLeft.y) * this.sim.size.y) * 1.1

    if (scale.value < 0.2) scale.value = 0.2
    if (scale.value > 0.4) scale.value = 0.4

    this.emitPoint = { x: center.x, y: center.y, z: this.hitPlane.position.z }
  }

  resetBoundingBox(firstPoint) {
    console.log("Reseting bounding box", firstPoint)
    if (!firstPoint) firstPoint = { x: 0.5, y: 0.5 }
    if(firstPoint.x === undefined) firstPoint.x = 0.5
    if(firstPoint.y === undefined) firstPoint.y = 0.5
    
    this.boundingBox = {
      topLeft: { x: firstPoint.x, y: firstPoint.y },
      bottomRight: { x: firstPoint.x, y: firstPoint.y },
      center: { x: firstPoint.x, y: firstPoint.y },
      scale: { value: 0.25 },
    }
  }

  setDownListeners(type) {
    this.DOMElement[type + "EventListener"]("mousedown", this.onMouseDown)
    this.DOMElement[type + "EventListener"]("touchstart", this.onTouchStart)
  }

  setMoveListeners(type) {
    this.DOMElement[type + "EventListener"]("mousemove", this.onMouseMove)
    this.DOMElement[type + "EventListener"]("touchmove", this.onTouchMove)
  }

  setUpListeners(type) {
    this.DOMElement[type + "EventListener"]("mouseup", this.onMouseUp)
    this.DOMElement[type + "EventListener"]("touchend", this.onTouchEndOrCancel)
    this.DOMElement[type + "EventListener"]("touchcancel", this.onTouchEndOrCancel)
  }

  onStateChange = (state) => {
    this.lastState = this.state
    this.state = state.value

    if (state.changed || this.state === "IDLE") {
      switch (this.state) {
        case "IDLE":
          this.machine.send("ready")
          break
        case "ACTIVE":
          this.clearSpell()
          this.setDownListeners("add")
          break
        case "SUCCESS":
          this.successCallback(this.castSpell.type)
          this.machine.send("complete")
          break
        case "FAIL":
          this.failCallback()
          this.machine.send("complete")
          break
        case "CASTING":
          this.castSpell = null
          this.clearInput()

          this.setDownListeners("remove")
          this.setMoveListeners("add")
          this.setUpListeners("add")

          break
        case "PROCESSING":
          this.setMoveListeners("remove")
          this.setUpListeners("remove")
          this.proccessPath()
          break
        case "INACTIVE":
          this.setDownListeners("remove")
          this.setMoveListeners("remove")
          this.setUpListeners("remove")
          this.castSpell = null
          this.clearInput()
          if (this.lastState === "CASTING") {
            this.clearSpell()
            this.onCastFail()
          }
      }
    }
  }

  drawInputPath() {
    if (window.DEBUG.casting) {
      this.pathElement.setAttribute(
        "d",
        `M${this.spellPath[0].x} ${this.spellPath[0].y}L${this.spellPath
          .map((point) => `${point.x} ${point.y}`)
          .join("L")}`
      )
    }
  }

  clearInput() {
    if (window.DEBUG.casting) {
      this.pathElement.setAttribute("d", "")
      this.pathPointsGroup.innerHTML = ""
    }
  }

  drawInputPoints(points) {
    if (window.DEBUG.casting) {
      points.forEach((point) => {
        var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        circle.setAttributeNS(null, "cx", point.x)
        circle.setAttributeNS(null, "cy", point.y)
        circle.setAttributeNS(null, "r", 2)
        this.pathPointsGroup.appendChild(circle)
      })
    }
  }

  proccessPath() {
    this.drawInputPath()
    const points = this.getEvenlySpacedPoints(this.spellPath)

    this.drawInputPoints(points)

    const checks = {
      x: this.getPathLengths(points, "x"),
      y: this.getPathLengths(points, "y"),
    }

    // console.log("checks", checks)

    const results = this.spells.map((spell, i) => {
      const result = {
        x: this.getCorrelation(checks.x, spell.lengths.x),
        y: this.getCorrelation(checks.y, spell.lengths.y),
      }

      const score = (result.x + result.y) / 2

      return { type: spell.type, spell, score, index: i, result }
    })

    const winner = results.reduce(
      (currentWinner, contender) => {
        if (contender.score <= 1 && contender.score >= 0.8 && contender.score > currentWinner.score) return contender
        return currentWinner
      },
      { score: 0, type: null, index: -1 }
    )

    if (winner.type) {
      if ((this.spellStates[winner.type].charge === 1 || this.noRecharge) && this.allowed.includes(winner.type)) {
        this.onCastSuccess(winner)
      } else {
        this.onInsufficientPower(winner)
      }
    } else this.onCastFail()

    this.outputResults(results, winner)

    this.emitter.reset()
  }

  getSpellColor(type) {
    switch (type) {
      case "arcane":
        return { r: 0.2, g: 0, b: 1 }
      case "fire":
        return { r: 1, g: 0.8, b: 0 }
      case "vortex":
      default:
        return { r: 0, g: 1, b: 0 }
    }
  }

  onCastSuccess(spell) {
    this.castSpell = spell
    this.spellStates[spell.type].charge = this.noRecharge ? 1 : 0
    this.machine.send("success")

    SOUNDS.play("cast")
    // SOUNDS.play("ping")

    // if (this.castSpell.type === "arcane") setTimeout(() => this.animateSpellPlane(), 300)

    this.sim.castParticles.forEach((index) => {
      const point = {
        index,
        life: 0.5,
        ...this.sim.getVectorFromArray(this.sim.getParticlesProperties("magic", "position"), index),
      }

      const newPointType = Math.random() > 0.5 ? PARTICLE_STYLES.circle : PARTICLE_STYLES.point
      const spark = newPointType === PARTICLE_STYLES.point
      setTimeout(
        () => (this.sim.getParticlesProperties("magic", "type")[index] = newPointType),
        Math.random() * (spark ? 10 : 100)
      )

      this.sim.updateArrayFromVector(
        this.sim.getParticlesProperties("magic", "color"),
        index,
        spark ? { r: 1, g: 1, b: 1 } : this.getSpellColor(spell.type)
      )

      gsap.to(point, {
        // life: 0.2,
        motionPath: [
          {
            x: this.emitPoint.x,
            y: point.y,
            z: 0.9,
          },
          {
            x: this.emitPoint.x + Math.random() * 0.1 - 0.05,
            y: point.y + Math.random() * 0.1 - 0.05,
            z: 0.9,
          },
          !spark
            ? this.emitPoint
            : {
                x: this.emitPoint.x + Math.random() * 0.4 - 0.2,
                y: point.y + Math.random() * 0.4 - 0.2,
                z: 0.9 - Math.random() * 0.2,
              },
        ],
        ease: !spark ? "power4.in" : "power1.out",
        duration: (spark ? 2 : 0.9) + Math.random() * 0.05,
        life: spark ? 0 : 0.3,
        onUpdateParams: [point],
        onUpdate: (d) => {
          this.sim.getParticlesProperties("magic", "life")[d.index] = d.life
          this.sim.updateArrayFromVector(this.sim.getParticlesProperties("magic", "position"), d.index, {
            x: d.x,
            y: d.y,
            z: d.z,
          })
        },
        onCompleteParams: [point],
        onComplete: (d) => {
          this.sim.getParticlesProperties("magic", "life")[d.index] = 0
        },
      })
    })
    this.sim.castParticles = []
  }

  onInsufficientPower(spell) {
    this.machine.send("fail")

    this.castSpell = spell
    const newPointType = PARTICLE_STYLES.circle

    this.sim.castParticles.forEach((index) => {
      this.sim.updateArrayFromVector(this.sim.getParticlesProperties("magic", "color"), index, { r: 1, g: 0, b: 0 })
    })

    setTimeout(() => {
      while (this.sim.castParticles.length) {
        const particleIndex = this.sim.castParticles.shift()
        this.sim.getParticlesProperties("magic", "lifeDecay")[particleIndex] = 0.4
        this.sim.getParticlesProperties("magic", "force")[particleIndex] = 0
        this.sim.getParticlesProperties("magic", "forceDecay")[particleIndex] = 0.2
      }
    }, 500)
    
    if (this.rechargeNotificationTimeout) clearTimeout(this.rechargeNotificationTimeout)

    this.rechargeNotificationTimeout = setTimeout(() => {
      this.chargingNotification.classList.remove("show")
    }, 2000)

    this.chargingNotificationSpellName.innerText = SPELLS[spell.type]
    this.chargingNotification.classList.add("show")
  }

  onCastFail() {
    this.castSpell = null
    this.machine.send("fail")

    SOUNDS.play("spell-failed")

    while (this.sim.castParticles.length) {
      const particleIndex = this.sim.castParticles.shift()
      this.sim.getParticlesProperties("magic", "lifeDecay")[particleIndex] = 0.4
      // this.sim.updateArrayFromVector(this.sim.particleDirection, particleIndex, { x: 0, y: -1, z: 0 })
      this.sim.getParticlesProperties("magic", "force")[particleIndex] = 0
      this.sim.getParticlesProperties("magic", "forceDecay")[particleIndex] = 0.2
      // this.sim.particleSpeed[particleIndex] = 0.1

      const point = {
        index: particleIndex,
        speed: 0.015,
      }

      gsap.to(point, {
        // life: 0.2,
        speed: 0.15,
        ease: "power2.in",
        duration: 0.3,

        onUpdateParams: [point],
        onUpdate: (d) => {
          this.sim.getParticlesProperties("magic", "speed")[d.index] = d.speed
          // this.sim.updateArrayFromVector(this.sim.particlePosition, d.index, { x: d.x, y: d.y, z: d.z })
        },
      })
    }
  }

  outputResults(results, winner) {
    if (window.DEBUG.casting) {
      this.spells.forEach((spell, i) => {
        spell.groupElement.classList[i === winner.index ? "add" : "remove"]("cast")
      })

      results.forEach((result) => {
        result.spell.scoreElement.innerText = result.score
      })
    }
  }

  getCorrelation(x, y) {
    var shortestArrayLength = 0
    if (x.length == y.length) {
      shortestArrayLength = x.length
    } else if (x.length > y.length) {
      shortestArrayLength = y.length
      // console.error("x has more items in it, the last " + (x.length - shortestArrayLength) + " item(s) will be ignored")
    } else {
      shortestArrayLength = x.length
      // console.error("y has more items in it, the last " + (y.length - shortestArrayLength) + " item(s) will be ignored")
    }

    var xy = []
    var x2 = []
    var y2 = []

    for (var i = 0; i < shortestArrayLength; i++) {
      xy.push(x[i] * y[i])
      x2.push(x[i] * x[i])
      y2.push(y[i] * y[i])
    }

    var sum_x = 0
    var sum_y = 0
    var sum_xy = 0
    var sum_x2 = 0
    var sum_y2 = 0

    for (var i = 0; i < shortestArrayLength; i++) {
      sum_x += x[i]
      sum_y += y[i]
      sum_xy += xy[i]
      sum_x2 += x2[i]
      sum_y2 += y2[i]
    }

    var step1 = shortestArrayLength * sum_xy - sum_x * sum_y
    var step2 = shortestArrayLength * sum_x2 - sum_x * sum_x
    var step3 = shortestArrayLength * sum_y2 - sum_y * sum_y
    var step4 = Math.sqrt(step2 * step3)
    var answer = step1 / step4

    return answer
  }

  getEvenlySpacedPoints(path, numPoints = 100) {
    const totalLength = path.reduce((length, point, index) => {
      if (index > 0) {
        const prevPoint = path[index - 1]
        const deltaX = point.x - prevPoint.x
        const deltaY = point.y - prevPoint.y
        length += Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      }
      return length
    }, 0)

    // console.log("length:", totalLength)

    const segmentLength = totalLength / (numPoints - 1)
    let currentLength = 0
    let currentPointIndex = 0
    const evenlySpacedPoints = [path[0]]
    let lastPoint = null

    for (let i = 1; i < numPoints - 1; i++) {
      const targetLength = i * segmentLength

      while (currentLength < targetLength) {
        const startPoint = lastPoint ? lastPoint : path[currentPointIndex]
        const endPoint = path[currentPointIndex + 1]
        const deltaX = endPoint.x - startPoint.x
        const deltaY = endPoint.y - startPoint.y
        const segmentLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        if (currentLength + segmentLength >= targetLength) {
          const t = (targetLength - currentLength) / segmentLength
          lastPoint = {
            x: startPoint.x + t * deltaX,
            y: startPoint.y + t * deltaY,
          }

          evenlySpacedPoints.push(lastPoint)
          currentLength = targetLength
        } else {
          currentLength += segmentLength
          lastPoint = null
          currentPointIndex++
        }
      }
    }

    evenlySpacedPoints.push(path[path.length - 1]) // Add the last point

    return evenlySpacedPoints
  }

  activate(limit) {
    this.allowed = limit ? [limit] : this.spellNames
    this.machine.send("activate")
  }

  deactivate() {
    this.machine.send("deactivate")
  }

  getXYFromTouch = (event) => {
    const touches = event.changedTouches

    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i]
      if (!this.currentTouchId || this.currentTouchId === touch.identifier) {
        this.currentTouchId = touch.identifier
        return { x: touch.clientX - this.touchOffset.x, y: touch.clientY - this.touchOffset.y }
      }
    }
  }

  onTouchStart = (event) => {
    const touchPoint = this.getXYFromTouch(event)
    this.onSpellStart(touchPoint.x, touchPoint.y)
  }

  onMouseDown = (event) => {
    this.onSpellStart(event.offsetX, event.offsetY)
  }

  onSpellStart = (x, y) => {
    gsap.killTweensOf(this.pointLight)
    this.pointLight.intensity = 0.6
    // console.log(this.pointLight.intensity)
    this.machine.send("start_cast")
    this.addSpellPathPoint(x, y, true)
  }

  onTouchMove = (event) => {
    const touchPoint = this.getXYFromTouch(event)
    this.onSpellMove(touchPoint.x, touchPoint.y)
  }

  onMouseMove = (event) => {
    this.onSpellMove(event.offsetX, event.offsetY)
  }

  onSpellMove = (x, y) => {
    this.addSpellPathPoint(x, y)
    this.drawInputPath()
  }

  onTouchEndOrCancel = (event) => {
    const touchPoint = this.getXYFromTouch(event)
    this.currentTouchId = null
    this.onSpellEnd(touchPoint.x, touchPoint.y)
  }

  onMouseUp = (event) => {
    this.onSpellEnd(event.offsetX, event.offsetY)
  }

  onSpellEnd = (x, y) => {
    gsap.to(this.pointLight, { intensity: 0 })
    this.addSpellPathPoint(x, y)
    this.machine.send("finished")
  }

  reset(disableCharging = false) {
    this.spellNames.forEach((spell) => {
      this.spellStates[spell].charge = disableCharging ? 1 : 0
    })
    this.noRecharge = disableCharging ? true : false
    this.updateViz()
  }

  updateViz() {
    this.spellNames.forEach((spell) => {
      this.spellStates[spell].svg.style.setProperty("--charge", this.spellStates[spell].charge)
      this.spellStates[spell].svg.classList[this.spellStates[spell].charge === 1 ? "add" : "remove"]("ready")
    })
  }

  tick(delta) {
    if (this.state !== "IDLE" && !this.noRecharge) {
      this.spellNames.forEach((spell) => {
        const state = this.spellStates[spell]

        if (state.charge < 1) state.charge += state.rechargeRate * delta
        if (state.charge > 1) state.charge = 1

        this.updateViz()
      })
    }
  }
}

// STAGE

class Stage {
  constructor(mount) {
    this.container = mount

    this.scene = new Scene()
    this.scene.background = new Color("#000000")

    this.group = new Group()
    this.scene.add(this.group)
    this.paused = false

    const overlayGeometry = new PlaneGeometry(2, 2, 1, 1)
    this.overlayMaterial = new ShaderMaterial({
      transparent: true,
      vertexShader: `
			void main()
{
		vec3 p = vec3(position.x, position.y, -0.1);
		gl_Position = vec4(p, 1.0);
}
			`,
      fragmentShader: `
			uniform float uAlpha;

void main()
{
		gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
}
			`,
      uniforms: {
        uAlpha: { value: 1 },
      },
    })
    this.overlay = new Mesh(overlayGeometry, this.overlayMaterial)
    this.scene.add(this.overlay)

    // this.gui = new GUI()

    this.size = {
      width: 1,
      height: 1,
    }

    ColorManagement.enabled = false

    this.cameraPositions = {
      playing: { x: 0, y: 0.3, z: 1.3 },
      overhead: { x: 0, y: 2, z: 0 },
      paused: { x: 0, y: 0.6, z: 1.6 },
      crystalOffset: { x: 0, y: 0.02, z: 0.2 },
      crystalIntro: { x: 0, y: 0.02, z: 0.3 },
      demon: { x: 0.05, y: -0.1, z: 0.3 },
      crystal: { x: 0, y: 0.02, z: 0.3 },
      bookshelf: { x: 0, y: 0, z: 0.2 },
      spellLesson: { x: 0.1, y: 0.3, z: 1.2 },
      vortex: { x: 0, y: 0.7, z: 1.3 },
      win: { x: 0, y: 0.02, z: 0.3 },
    }

    this.cameraLookAts = {
      playing: { x: 0, y: -0.12, z: 0 },
      overhead: { x: 0, y: -0.12, z: 0 },
      paused: { x: 0, y: -0.12, z: 0 },
      crystalOffset: { x: 0.05, y: -0.065, z: 0 },
      crystalIntro: { x: 0, y: -0.1, z: 0 },
      demon: { x: -0.2, y: -0.1, z: -0.2 },
      crystal: { x: 0, y: -0.065, z: 0 },
      bookshelf: { x: -0.3, y: -0.07, z: -0.15 },
      spellLesson: { x: 0.15, y: -0.12, z: 0 },
      vortex: { x: 0, y: -0.12, z: 0 },
      win: { x: 0, y: -0.1, z: 0 },
    }

    this.defaultCameraPosition = "crystalOffset"

    this.setupCamera()
    this.setupRenderer()
    this.setupLights()
    // this.setupRenderPasses()

    this.setupOrbitControls()

    this.onResize()
    this.render()
  }

  setupRenderPasses() {
    this.composer = new EffectComposer(this.renderer)
    this.composer.setSize(this.size.width, this.size.height)
    this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const renderPass = new RenderPass(this.scene, this.camera)
    this.composer.addPass(renderPass)

    const ssaoPass = new SSAOPass(this.scene, this.camera, this.size.width, this.size.height)
    this.composer.addPass(ssaoPass)

    this.gui
      .add(ssaoPass, "output", {
        Default: SSAOPass.OUTPUT.Default,
        "SSAO Only": SSAOPass.OUTPUT.SSAO,
        "SSAO Only + Blur": SSAOPass.OUTPUT.Blur,
        Depth: SSAOPass.OUTPUT.Depth,
        Normal: SSAOPass.OUTPUT.Normal,
      })
      .onChange(function (value) {
        ssaoPass.output = value
      })

    this.gui.add(ssaoPass, "kernelRadius").min(0).max(32)
    this.gui.add(ssaoPass, "minDistance").min(0.001).max(0.02)
    this.gui.add(ssaoPass, "maxDistance").min(0.01).max(0.3)
    this.gui.add(ssaoPass, "enabled")
  }

  setupCamera() {
    const lookat = this.cameraLookAts[this.defaultCameraPosition]
    this.lookAt = new Vector3(lookat.x, lookat.y, lookat.z)
    this.camera = new PerspectiveCamera(35, this.size.width / this.size.height, 0.1, 3)

    this.camera.position.set(
      this.cameraPositions[this.defaultCameraPosition].x,
      this.cameraPositions[this.defaultCameraPosition].y,
      this.cameraPositions[this.defaultCameraPosition].z
    )
    this.camera.home = {
      position: { ...this.camera.position },
    }

    this.scene.add(this.camera)
  }

  reveal() {
    gsap.to(this.overlayMaterial.uniforms.uAlpha, {
      value: 0,
      duration: 2,
      onComplete: () => {
        this.overlay.visible = false
      },
    })
  }

  setupOrbitControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.controls.enabled = false
    // this.controls.
  }

  moveCamera(state, cb) {
    if (this.cameraPositions[state] && this.cameraLookAts[state]) {
      gsap.killTweensOf(this.camera.position)
      gsap.killTweensOf(this.lookAt)

      gsap.to(this.camera.position, {
        ...this.cameraPositions[state],
        duration: 2,
        ease: "power2.inOut",
        onComplete: () => {
          if (cb) cb()
        },
      })
      gsap.to(this.lookAt, { ...this.cameraLookAts[state], duration: 2, ease: "power2.inOut" })
    }
  }

  resetCamera() {
    this.moveCamera(this.defaultCameraPosition)
  }

  setupRenderer() {
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })

    this.renderer.outputColorSpace = LinearSRGBColorSpace
    this.renderer.toneMapping = ReinhardToneMapping
    this.renderer.toneMappingExposure = 8

    this.container.appendChild(this.renderer.domElement)
  }

  setupLights() {
    this.scene.add(new AmbientLight(0xffffff, 0.1))

    const light = new DirectionalLight(0xfcc088, 0.1)
    light.position.set(0, 3, -2)
    this.scene.add(light)
  }

  onResize() {
    this.size.width = this.container.clientWidth
    this.size.height = this.container.clientHeight

    this.camera.aspect = this.size.width / this.size.height

    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.size.width, this.size.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    if (this.composer) {
      this.composer.setSize(this.size.width, this.size.height)
      this.composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }
  }

  compile() {
    this.renderer.compile(this.scene, this.camera)
  }

  render() {
    if (!this.paused || !window.DEBUG.allowLookAtMoveWhenPaused) {
      this.camera.lookAt(this.lookAt)
      this.controls.target.x = this.lookAt.x
      this.controls.target.y = this.lookAt.y
      this.controls.target.z = this.lookAt.z
    }
    this.controls.update()

    if (this.composer) this.composer.render()
    else this.renderer.render(this.scene, this.camera)
  }

  add(element) {
    this.group.add(element)
  }

  destroy() {
    this.container.removeChild(this.renderer.domElement)
    window.removeEventListener("resize", this.onResize)
  }

  get everything() {
    return this.group
  }

  set defaultCamera(state) {
    console.log(state, this.cameraPositions[state])
    if (this.cameraPositions[state]) {
      this.defaultCameraPosition = state
      this.resetCamera()
    }
  }

  set useOrbitControls(enabled) {
    this.controls.enabled = enabled
  }
}

// TORCH

class Torch {
  constructor(sim, position, noise) {
    this.state = "OFF"
    this.elapsedTime = 0
    this._light = new TorchLight(position, sim.size, noise)
    this.emitter = new TorchEmitter(position, sim)

    // this.sceneObjects.add(torch.light)
  }

  on() {
    if (this.state !== "ON") {
      SOUNDS.play("torch")
      this.state = "ON"
      this._light.active = true
      this._light.color = "#FA9638"
      this.emitter.green = false
    }
  }

  off() {
    this.state = "OFF"
    this._light.active = false
  }

  green() {
    if (this.state !== "VORTEX") {
      SOUNDS.play("torch")
      this.state = "VORTEX"
      this._light.active = true
      this._light.color = "#00FF00"
      this.emitter.green = true
      this.emitter.flamePuff()
    }
  }

  tick(delta, elapsedTime) {
    if (this._light) this._light.tick(delta, this.elapsedTime)
    if (this.state !== "OFF") {
      this.elapsedTime += delta
      if (this.emitter) this.emitter.tick(delta, this.elapsedTime)
    }
  }

  get light() {
    return this._light.object
  }
}

// FRAGMENT SHADER UTIL

const includes = {
  noise: `
	//
	// Description : Array and textureless GLSL 2D simplex noise function.
	//      Author : Ian McEwan, Ashima Arts.
	//  Maintainer : ijm
	//     Lastmod : 20110822 (ijm)
	//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
	//               Distributed under the MIT License. See LICENSE file.
	//               https://github.com/ashima/webgl-noise
	//
	
	vec3 mod289(vec3 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
	}
	
	vec2 mod289(vec2 x) {
		return x - floor(x * (1.0 / 289.0)) * 289.0;
	}
	
	vec3 permute(vec3 x) {
		return mod289(((x*34.0)+1.0)*x);
	}
	
	float snoise(vec2 v)
		{
		const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
												0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
											-0.577350269189626,  // -1.0 + 2.0 * C.x
												0.024390243902439); // 1.0 / 41.0
	// First corner
		vec2 i  = floor(v + dot(v, C.yy) );
		vec2 x0 = v -   i + dot(i, C.xx);
	
	// Other corners
		vec2 i1;
		//i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0
		//i1.y = 1.0 - i1.x;
		i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
		// x0 = x0 - 0.0 + 0.0 * C.xx ;
		// x1 = x0 - i1 + 1.0 * C.xx ;
		// x2 = x0 - 1.0 + 2.0 * C.xx ;
		vec4 x12 = x0.xyxy + C.xxzz;
		x12.xy -= i1;
	
	// Permutations
		i = mod289(i); // Avoid truncation effects in permutation
		vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
			+ i.x + vec3(0.0, i1.x, 1.0 ));
	
		vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
		m = m*m ;
		m = m*m ;
	
	// Gradients: 41 points uniformly over a line, mapped onto a diamond.
	// The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)
	
		vec3 x = 2.0 * fract(p * C.www) - 1.0;
		vec3 h = abs(x) - 0.5;
		vec3 ox = floor(x + 0.5);
		vec3 a0 = x - ox;
	
	// Normalise gradients implicitly by scaling m
	// Approximation of: m *= inversesqrt( a0*a0 + h*h );
		m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
	
	// Compute final noise value at P
		vec3 g;
		g.x  = a0.x  * x0.x  + h.x  * x0.y;
		g.yz = a0.yz * x12.xz + h.yz * x12.yw;
		return 130.0 * dot(m, g);
	}
	`,
}

function FragmentShader(shader) {
  const importTypes = Object.keys(includes)

  importTypes.forEach((type) => {
    shader = shader.replace(`#include ${type}`, includes[type])
  })

  return shader
}

// APP

class App {
  constructor() {
    this.stage = new Stage(DOM.canvas)
    this.machine = interpret(AppMachine)
    this.animations = []
    this.frame = 0
    this.elapsedGameTime = 0
    this.health = 1
    this.healthDecay = 0.01
    this.healthReplenish = 0.015
    this.rotating = false
    this.noise = createNoise3D()
    this.rotationSpeed = 0.2
    this.gameSpeed = 1
    this.endlessMode = false

    if (window.DEBUG.endlessMode) {
      document.querySelector("#endless-mode").style.display = "block"
    }

    if (window.DEBUG.appState) {
      document.querySelector("#app-state").style.display = "block"
      DOM.app.classList.add("showState")
    }

    if (window.DEBUG.layoutDebug) {
      DOM.body.classList.add("debug-layout")
    }

    this.screens = new Screens(DOM.app, this.machine)

    this.enemyState = { ...ENEMY_SETTINGS }

    this.appState = this.machine.initialState.value

    this.emitters = []
    this.enemies = []
    this.torches = []

    this.init()
  }

  init() {
    this.clock = new Clock()
    this.clockWasPaused = false

    this.machine.onTransition((s) => this.onStateChange(s))
    this.machine.start()

    document.body.addEventListener("keyup", (event) => {
      console.log("KEYUP", event)
      switch (event.key) {
        case "p":
          this.machine.send(this.isPaused ? "resume" : "pause")
          break
        case "d":
          this.stage.defaultCamera = this.stage.defaultCameraPosition === "playing" ? "overhead" : "playing"
          break
        case "c":
          DOM.body.classList.toggle("clear-interface")
          break
      }
    })

    const demonTotalElementa = [...document.querySelectorAll("[data-demon-total]")]
    demonTotalElementa.forEach((el) => (el.innerText = ENEMY_SETTINGS.totalSend))

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.clockWasPaused = true
        this.machine.send("pause")
      }
    })

    this.onResize()
    setTimeout(() => this.onResize(), 500)
    window.addEventListener("resize", this.onResize)
    this.setupStats()

    this.tick()
  }

  onLocationRelease = (index) => {
    if (this.freeLocations.indexOf(index) < 0) this.freeLocations.push(index)
  }

  onResize = () => {
    this.stage.onResize()
    if (this.spellCaster) this.spellCaster.onResize()

    DOM.svg.setAttribute("width", DOM.body.offsetWidth)
    DOM.svg.setAttribute("height", DOM.body.offsetHeight)
    // this.
  }

  createScene = () => {
    this.room = new Room()

    this.sim = new ParticleSim({ pixelRatio: this.stage.renderer.getPixelRatio() })
    if (window.DEBUG.simNoise || window.DEBUG.simFlow)
      this.viz = new SimViz(this.stage, this.sim, window.DEBUG.simFlow, window.DEBUG.simNoise)

    this.sceneObjects = new Group()
    this.sceneObjects.position.add(this.sim.startCoords)

    this.stage.add(this.sceneObjects)

    this.sim.particleMeshes.forEach((mesh) => {
      this.stage.add(mesh)
    })

    this.crystal = new Crystal(
      this.sim,
      () => this.machine.send("run"),
      () => this.machine.send("end")
    )

    this.room.add(this.crystal.group)

    // this.sim.particles.renderOrder = 1

    this.entrances = [
      new Entrance(
        "door",
        [
          { x: 0.7, y: 0.35, z: -0.1 },
          { x: 0.47, y: 0.3, z: 0.05 },
        ],
        this.room.doorEnter
      ),
      new Entrance("bookcase", [
        { x: -0.1, y: 0.4, z: 0.45 },
        { x: 0.05, y: 0.4, z: 0.53 },
      ]),
      new Entrance("large-window", [
        { x: 1.01, y: 0.4, z: 0.5 },
        { x: 0.95, y: 0.5, z: 0.5 },
      ]),
      new Entrance(
        "trapdoor",
        [
          { x: 0.83, y: -0.1, z: 0.2 },
          { x: 0.83, y: 0.3, z: 0.2 },
        ],
        this.room.trapdoorEnter
      ),
    ]

    if (window.DEBUG.entrances) this.entrances.forEach((e) => e.createDebugMarkers(this.sceneObjects, this.sim.size))

    this.freeLocations = []
    const locationColors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00]
    this.enemyLocations = [
      { x: 0.25, y: 0, z: 0.3, r: Math.PI * 2 * 0.1 },
      { x: 0.8, y: 0, z: 0.4, r: Math.PI * 2 * 0.8 },
      { x: 0.6, y: 0, z: 0.2, r: Math.PI * 2 * 0.95 },
      { x: 0.2, y: 0, z: 0.7, r: Math.PI * 2 * 0.3 },
      { x: 0.81, y: 0, z: 0.68, r: Math.PI * 2 * 0.7 },
    ].map((d, i) => {
      return new Location(d, this.sim.size, this.entrances, this.onLocationRelease, locationColors[i])
    })

    this.enemyLocations.forEach((location, i) => {
      this.sceneObjects.add(location.group)
      location.index = i
      location.energyEmitter = new EnemyEnergyEmitter(this.sim, location.position)
      this.freeLocations.push(i)
    })
  }

  onStateChange = (state) => {
    this.appState = state.value

    if (state.changed || this.appState === "IDLE") {
      // temporary state controls

      console.log("NEW APP STATE:", this.appState)

      DOM.controls.innerHTML = ""
      if (this.winEmitter) this.winEmitter.active = false

      this.screens.update(this.appState)

      DOM.state.innerText = this.appState
      state.nextEvents.forEach((event) => {
        const button = document.createElement("BUTTON")
        button.innerHTML = event
        button.addEventListener("click", () => {
          this.machine.send(event)
        })
        DOM.controls.appendChild(button)
      })

      switch (this.appState) {
        case "IDLE":
          this.machine.send("load")
          break
        case "LOADING":
          ASSETS.load(
            () => {
              this.machine.send("complete")
            },
            (err) => {
              this.machine.send("error")
            }
          )
          break

        case "INIT":
          this.createScene()

          SOUNDS.init(this.stage)
          //add a little demo in the scene so it gets all loaded into memory
          // const demon = ASSETS.getModel("demon")
          // demon.scene.position.y = -0.2
          // this.stage.add(demon.scene)

          this.enemyPool = new EnemyPreloader(this.stage)

          this.stage.add(this.room.group)

          this.addEmitter(new DustEmitter(this.sim))

          this.winEmitter = new WinEmitter(this.sim)
          this.winEmitter.active = false
          this.addEmitter(this.winEmitter)

          this.spellLights = [0xffffff, 0xffffff, 0xffffff].map((color) => this.makePointLight(color))
          this.spellLightsCount = -1

          this.spellCaster = new SpellCaster(
            this.sim,
            this.sceneObjects,
            this.stage,
            DOM.canvas,
            (spellID) => {
              DOM.spellGuide.classList.remove("show")
              console.log("casting spell ", spellID)
              switch (spellID) {
                case "arcane":
                  let arcaneEnemies = this.getEnemy(spellID, 1)
                  arcaneEnemies.forEach((enemy) => {
                    let spell = new ArcaneSpellEmitter(this.sim, this.spellLight, this.spellCaster.emitPoint, enemy)
                    this.addEmitter(spell)
                  })
                  break
                case "fire":
                  let fireEnemies = this.getEnemy(spellID, 2)
                  fireEnemies.forEach((enemy) => {
                    let spell = new FireSpellEmitter(this.sim, this.spellLight, this.spellCaster.emitPoint, enemy)
                    this.addEmitter(spell)
                  })
                  break
                case "vortex":
                  let spell = new VortexSpellEmitter(this.sim, this.spellLight, this.spellCaster.emitPoint)
                  this.machine.send("special")
                  this.addEmitter(spell)
                  break
              }
            },
            () => {}
          )

          const torchPositions = [
            { x: 0.036, y: 0.45, z: 0.845 },
            { x: 0.14, y: 0.45, z: 0.035 },
            { x: 0.865, y: 0.45, z: 0.035 },
            { x: 0.952, y: 0.63, z: 0.632 },
          ]

          this.torches = torchPositions.map((position) => {
            const torch = new Torch(this.sim, position, this.noise)
            this.sceneObjects.add(torch.light)

            // const emitter = new torchEmitter(position, this.sim)
            // this.addEmitter(emitter)

            return torch
          })

          this.room.afterCompile = () => {
            setTimeout(() => {
              this.machine.send("begin")
            }, 500)
          }

          break
        case "TITLE_SCREEN":
          this.stage.reveal()
          this.staggerTorchesOff()
          this.room.hide()
          this.resetRotation()
          this.stage.useOrbitControls = false
          this.stage.moveCamera("crystalOffset")
          break
        case "SCENE_DEBUG":
          this.resetRotation()
          this.stage.moveCamera("playing")
          this.stage.useOrbitControls = true
          this.room.show()
          this.staggerTorchesOn()
          this.enemyState.sendCount = 0
          break
        case "SETUP_GAME":
          this.startGame()
          break
        case "SETUP_ENDLESS":
          this.startEndless()
          break
        case "INSTRUCTIONS_CRYSTAL":
          // this.rotate()

          this.resetRotation()
          this.room.hide()
          this.stage.moveCamera("crystalIntro")
          // SOUNDS.prep()
          SOUNDS.startMusic()
          break
        case "INSTRUCTIONS_DEMON":
          this.resetLocations()
          this.enemyState = { ...ENEMY_SETTINGS }
          this.stage.moveCamera("demon")

          // setTimeout(() => {
          const demoDemon = this.addEnemy(this.enemyLocations[0], "arcane")
          console.log("demoDemon:", demoDemon)
          demoDemon.onDeadCallback = () => {
            this.machine.send("next")
          }
          // }, 500)
          // this.stage.moveCamera("crystal")
          break
        case "INSTRUCTIONS_CAST":
          // this.staggerTorchesOn()
          setTimeout(() => {
            DOM.spellGuide.classList.add("show")
          }, 500)
          this.stage.moveCamera("spellLesson")
          this.spellCaster.reset(true)
          this.spellCaster.activate("arcane")
          break
        case "INSTRUCTIONS_SPELLS":
          this.stage.moveCamera("playing")
          this.spellCaster.deactivate()
          this.room.show(0.2)
          // this.stage.moveCamera("crystal")
          break
        case "GAME_RUNNING":
        case "ENDLESS_MODE":
          this.resumeGame()
          break
        case "PAUSED":
        case "ENDLESS_PAUSE":
          this.pauseGame()
          break
        case "SPECIAL_SPELL":
        case "ENDLESS_SPECIAL_SPELL":
          this.yayItsVortexTime()
          break
        case "SPELL_OVERLAY":
        case "ENDLESS_SPELL_OVERLAY":
          this.pauseGame()
          break
        case "CLEAR_GAME":
        case "CLEAR_ENDLESS":
          this.endGame()
          this.machine.send("end")
          break
        case "GAME_OVER_ANIMATION":
          this.endGame()
          this.room.hide()
          // this.rotate()
          this.stage.moveCamera("crystal")
          this.crystal.explode()
          break
        case "RESETTING_FOR_INSTRUCTIONS":
          this.crystal.reset()
          break
        case "RESETTING_FOR_CREDITS":
          this.crystal.reset()
          break
        case "GAME_OVER":
          break
        case "WIN_ANIMATION":
          this.endGame()
          this.room.hide()
          this.machine.send("end")
          this.rotate()
          break
        case "WINNER":
          this.stage.moveCamera("win")
          setTimeout(() => (this.winEmitter.active = true), 500)
          break
        case "CREDITS":
          this.resetRotation()
          this.room.show(0.2)
          this.staggerTorchesOn()
          this.stage.moveCamera("bookshelf")
          SOUNDS.startMusic()
          break

        default:
          break
      }
    }
  }

  yayItsVortexTime() {
    this.spellCaster.deactivate()
    this.torches.forEach((torch, i) => {
      gsap.delayedCall(i * 0.1, () => torch.green())
    })

    gsap.delayedCall(1.3, () => {
      this.stage.moveCamera("vortex")
      this.enemies.forEach((enemy) => {
        if (enemy && enemy.state === "ALIVE") {
          enemy.getSuckedIntoTheAbyss()
        }
      })
      this.room.showVortex(() => {
        gsap.delayedCall(1, () => {
          this.room.hideVortex(() => {
            if (this.appState === "SPECIAL_SPELL" || this.appState === "ENDLESS_SPECIAL_SPELL")
              this.staggerTorchesOn(true)

            this.machine.send("complete")

            // it's callbacks all the way down
          })
        })
      })
    })
  }

  resetLocations() {
    this.freeLocations = []
    this.enemyLocations.forEach((location, i) => {
      this.freeLocations.push(i)
    })

    this.enemyPool.resetAll()
  }

  staggerTorchesOn(instant = false) {
    this.torches.forEach((torch, i) => {
      gsap.delayedCall((instant ? 0 : 1.5) + i * 0.1, () => torch.on())
    })
  }

  staggerTorchesOff() {
    this.torches.forEach((torch, i) => {
      gsap.delayedCall(i * 0.1, () => torch.off())
    })
  }

  setInitialStates() {
    SOUNDS.startMusic()
    this.resetLocations()
    this.spellCaster.reset(this.appState === "SETUP_ENDLESS")
    this.staggerTorchesOn()
    this.health = 1
    this.elapsedGameTime = 0 // we start a little bit in so that the first demon appears a little quicker

    // this.room.hide()
    this.room.show()
  }

  setupStats() {
    if (window.DEBUG.fps) {
      this.stats = new Stats()
      const element = document.querySelector("#fps")
      element.style.display = "block"
      element.appendChild(this.stats.dom)
    }
  }

  startGame() {
    // this.crystalEnergy.active = true

    this.enemyState = { ...ENEMY_SETTINGS, lastSent: 2.5 } // we don't start on zero so that the first demon enters faster
    this.setInitialStates()
    this.endlessMode = false
    this.crystal.reset()
    // this.machine.send("run")
  }

  startEndless() {
    this.enemyState = { ...ENEMY_SETTINGS, sendFrequency: 2 }
    this.setInitialStates()
    this.endlessMode = true
    this.crystal.reset()
    // this.machine.send("run")
  }

  pauseGame() {
    // this.clock.stop()
    this.room.pause()
    this.spellCaster.deactivate()
    this.stage.moveCamera("paused")
    this.emitters.forEach((e) => e.pause())
    this.enemies.forEach((e) => e.pause())
    this.stage.paused = true

    this.stage.useOrbitControls = true
  }

  resumeGame() {
    // this.clock.start()
    // this.staggerTorchesOn(true)
    this.room.resume()
    this.stage.paused = false
    this.stage.useOrbitControls = false
    this.spellCaster.activate()
    this.stage.moveCamera("playing")
    this.emitters.forEach((e) => e.resume())
    this.enemies.forEach((e) => e.resume())
    this.resetRotation()
  }

  endGame() {
    // this.crystalEnergy.active = false
    this.spellCaster.deactivate()
    this.staggerTorchesOff()
    // this.room.crystal.explode()
    this.enemies.forEach((e) => e.accend())
  }

  getEnemy(type, count) {
    if (!type) return null
    const toReturn = []
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i]
      if (enemy.state === "ALIVE" && toReturn.length < count) {
        toReturn.push(enemy)
      }
    }

    if (toReturn.length) return toReturn
    return [null]
  }

  makePointLight = (color) => {
    const pointLight = new PointLight(color, 0, 0.8)
    // pointLight.castShadow = true
    this.sceneObjects.add(pointLight)

    return pointLight
  }

  addEmitter(emitter) {
    if (emitter.model) {
      console.log("model", emitter.model)
      this.sceneObjects.add(emitter.model.group)
    }
    this.emitters.push(emitter)
  }

  getFreeLocation() {
    if (!this.freeLocations.length) return null

    const i = Math.floor(Math.random() * this.freeLocations.length)
    const nextLocation = this.freeLocations.splice(i, 1)
    return this.enemyLocations[nextLocation]
  }

  updateOnScreenEnemyInfo() {
    DOM.demonCount.innerText = this.enemyState.killCount
  }

  addEnemy(forceLocation, forceSpell) {
    if (["GAME_RUNNING", "ENDLESS_MODE", "INSTRUCTIONS_DEMON"].indexOf(this.appState) >= 0) {
      console.log("add enemy", forceLocation)
      const location = forceLocation ? forceLocation : this.getFreeLocation()
      if (location && this.enemyState.sendCount < this.enemyState.totalSend) {
        const enemy = new Enemy(this.sim, this.enemyPool.borrowDemon(), forceSpell)
        // if (enemy.model) this.sceneObjects.add(enemy.model)
        enemy.spawn(location)
        if (enemy.emitter) this.addEmitter(enemy.emitter)

        enemy.onDeadCallback = () => {
          this.enemyState.killCount++
          if (this.enemyState.killCount === this.enemyState.totalSend) this.machine.send("win")
        }
        if (this.appState === "GAME_RUNNING") this.enemyState.sendCount++
        this.enemies.push(enemy)

        return enemy
      }
    }
    return null
  }

  rotate() {
    this.rotating = true
    gsap.to(this, { rotationSpeed: 0.2, duration: 1, ease: "power2.in" })
  }

  resetRotation() {
    this.rotating = false
    const goClockwise = this.stage.everything.rotation.y > Math.PI ? true : false
    gsap.to(this, { rotationSpeed: 0, duration: 1, ease: "power2.out" })
    gsap.to(this.stage.everything.rotation, { y: goClockwise ? Math.PI * 2 : 0, duration: 1, ease: "power2.inOut" })
  }

  tick() {
    if (this.stats) this.stats.begin()

    this.updateOnScreenEnemyInfo()

    document.body.style.setProperty("--health", this.health)

    let delta = this.clock.getDelta()

    if (this.clockWasPaused) {
      delta = 0
      this.clockWasPaused = false
    }

    if (this.spellCaster) {
      const rechargeableStates = ["GAME_RUNNING", "ENDLESS_MODE", "SPECIAL_SPELL", "ENDLESS_SPECIAL_SPELL"]
      if (rechargeableStates.includes(this.appState)) {
        this.spellCaster.tick(delta)
      }
    }

    if (this.sim) {
      if (!this.isPaused) {
        this.elapsedGameTime += delta
        // const elapsedTime = this.clock.getElapsedTime()

        this.animations.map((mixer) => {
          mixer.update(delta * mixer.timeScale)
        })

        for (let i = this.emitters.length - 1; i >= 0; i--) {
          let emitter = this.emitters[i]
          if (emitter === null || emitter.destroyed) {
            emitter = null
            this.emitters.splice(i, 1)
          } else {
            emitter.tick(delta, this.elapsedGameTime)
          }
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
          let enemy = this.enemies[i]
          if (enemy === null || enemy.dead) {
            enemy = null
            this.enemies.splice(i, 1)
          } else {
            enemy.tick(delta, this.elapsedGameTime)
          }
        }

        for (let i = this.torches.length - 1; i >= 0; i--) {
          this.torches[i].tick(delta, this.elapsedGameTime)
        }

        const es = this.enemyState

        if (this.endlessMode && this.enemies.length) {
          es.lastSent = 0
        }

        if (this.isPlaying) {
          es.lastSent += delta
          if (es.lastSent >= es.sendFrequency) {
            if (!this.endlessMode || !this.enemies.length) {
              es.lastSent = 0
              es.sendFrequency -= es.sendFrequencyReduceBy
              if (es.sendFrequency < es.minSendFrequency) es.sendFrequency = es.minSendFrequency

              this.addEnemy()
            }
          }
        }

        if (this.isPlaying && !this.endlessMode) {
          this.health += this.healthReplenish * delta
          this.health -= this.enemies.length * (this.healthDecay * delta)
          this.health = Math.min(1, Math.max(0, this.health))
        }

        if (this.isPlaying && this.health <= 0) this.machine.send("game-over")

        this.sim.step(delta, this.elapsedGameTime)
        if (this.viz) this.viz.tick()
      }

      if (this.rotating) {
        this.stage.everything.rotation.y += this.rotationSpeed * delta
        this.stage.everything.rotation.y = this.stage.everything.rotation.y % (Math.PI * 2)
      }

      for (let i = this.enemyLocations.length - 1; i >= 0; i--) {
        const location = this.enemyLocations[i]
        if (location.energyEmitter) location.energyEmitter.tick(delta, this.elapsedGameTime)
      }

      this.stage.render()
      this.frame++
    }

    if (this.room) this.room.tick(delta, this.elapsedGameTime)

    if (this.crystal) this.crystal.tick(delta)

    if (this.stats) this.stats.end()
    window.requestAnimationFrame(() => this.tick())
  }

  get spellLight() {
    this.spellLightsCount++
    return this.spellLights[this.spellLightsCount % this.spellLights.length]
  }

  get isPaused() {
    return ["PAUSED", "ENDLESS_PAUSE", "SPELL_OVERLAY", "ENDLESS_SPELL_OVERLAY"].indexOf(this.appState) >= 0
  }

  get isPlaying() {
    return ["GAME_RUNNING", "ENDLESS_MODE"].indexOf(this.appState) >= 0
  }
}

// lets get this party started:

const app = new App()