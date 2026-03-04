# Unity 2D Hill Climb (LTS 2022/2023) — Setup Guide

## 1) Project folders
Create folders:
- `Assets/Scenes`
- `Assets/Scripts`
- `Assets/Prefabs`

## 2) Scenes
Create and save 2 scenes:
- `Assets/Scenes/GarageScene.unity`
- `Assets/Scenes/RunScene.unity`

Add both scenes to Build Settings (Garage first).

---

## 3) RunScene hierarchy and exact setup

### Hierarchy
- `RunRoot` (empty)
  - `GameManager` (script: `RunGameManager`)
  - `TerrainGenerator` (script: `TerrainGenerator2D`)
  - `Car` (empty root)
    - `Body` (SpriteRenderer square + Rigidbody2D + BoxCollider2D + tag `CarBody`)
    - `FrontWheel` (SpriteRenderer circle + Rigidbody2D + CircleCollider2D)
    - `RearWheel` (SpriteRenderer circle + Rigidbody2D + CircleCollider2D)
  - `Main Camera` (script: `CameraFollowX`)
  - `Canvas`
    - `TopLeft/DistanceText` (TMP_Text)
    - `TopRight/FuelBarBg`
      - `FuelFill` (Image Fill Horizontal)
    - `TopRight/CoinsText` (TMP_Text)
    - `Bottom/GasButton` (Button + `HoldButton`)
    - `Bottom/BrakeButton` (Button + `HoldButton`)
    - `GameOverPanel`
      - `Title` (TMP_Text)
      - `RestartButton`
      - `GarageButton`
  - `MobileInput` (script: `MobileInput`)
  - `CoinPickupPrefab` (prefab in Assets/Prefabs)
  - `FuelPickupPrefab` (prefab in Assets/Prefabs)

### Car physics values (recommended)
- `Body Rigidbody2D`:
  - Body Type: Dynamic
  - Mass: `2.2`
  - Linear Drag: `0.2`
  - Angular Drag: `0.6`
  - Collision Detection: Continuous
- `Front/Rear Wheel Rigidbody2D`:
  - Mass: `0.8`
  - Linear Drag: `0.1`
  - Angular Drag: `0.05`
- Add `PhysicsMaterial2D` for wheel colliders:
  - Friction `1.2`, Bounciness `0`
- Add `PhysicsMaterial2D` for ground:
  - Friction `0.95`, Bounciness `0`

### Wheel joints
Add `WheelJoint2D` on `Body` object twice (or one per wheel object; simplest is on body referencing wheel RBs):
- Front joint connected body: `FrontWheel Rigidbody2D`
- Rear joint connected body: `RearWheel Rigidbody2D`
- Auto Configure Connected Anchor: OFF
- Anchors: near wheel positions under body
- Use Motor: ON
- Motor max torque start value: `1300`
- Suspension Frequency: `3.5`
- Damping Ratio: `0.7`

### Scripts binding
- `CarController2D` goes on `Car` root.
  - Assign body/wheels rigidbodies and both wheel joints.
  - Assign `MobileInput`.
- `RunGameManager`:
  - Assign car ref, UI refs, gameOverPanel.
  - Hook buttons:
    - Restart -> `RunGameManager.RestartRun`
    - Garage -> `RunGameManager.BackToGarage`
- `CameraFollowX` on camera, target = `Car/Body`.
- `TerrainGenerator2D`:
  - Assign car target (`Car/Body` transform)
  - Assign ground material
  - Assign `CoinPickup` and `FuelPickup` prefabs.
- `HoldButton`:
  - Gas button event -> `MobileInput.SetGas(bool)`
  - Brake button event -> `MobileInput.SetBrake(bool)`

### Pickup prefabs
- Coin prefab:
  - SpriteRenderer circle, yellow
  - CircleCollider2D (IsTrigger=true)
  - `CoinPickup` script
- Fuel prefab:
  - SpriteRenderer square, red
  - BoxCollider2D (IsTrigger=true)
  - `FuelPickup` script

---

## 4) GarageScene hierarchy and setup

### Hierarchy
- `GarageRoot`
  - `Canvas`
    - `TotalCoinsText` (TMP_Text)
    - `EngineRow` (LevelText, CostText, UpgradeButton)
    - `FuelRow` (LevelText, CostText, UpgradeButton)
    - `SuspensionRow` (LevelText, CostText, UpgradeButton)
    - `StartButton`
  - `GarageUI` (script: `GarageUI`)

### Bindings
In `GarageUI` inspector:
- `totalCoinsText` -> TotalCoinsText
- `rows[0]` Engine
- `rows[1]` FuelTank
- `rows[2]` Suspension
For each row assign texts/button.
Start button OnClick -> `GarageUI.OnStartRun`.

---

## 5) Gameplay behavior implemented
- Infinite terrain chunk generation (perlin hills + edge collider + line renderer).
- Coins and fuel pickups spawn on chunks and are cleaned up behind car.
- Fuel drains over time and faster when throttle is active.
- Distance shown as `carX / 10` meters.
- Game over by:
  - upside-down for >1.5 sec
  - fuel reached zero (after 2 sec delay)
- Coins from run are added to total balance on game over.
- Garage upgrades saved in `PlayerPrefs`:
  - `TotalCoins`, `EngineLevel`, `FuelLevel`, `SuspensionLevel`

---

## 6) Android debug APK quick checklist
1. Install Android Build Support in Unity Hub (SDK/NDK + OpenJDK).
2. On phone enable Developer options + USB debugging.
3. Connect via USB, allow RSA prompt on phone.
4. In Unity: `File -> Build Settings -> Android -> Switch Platform`.
5. Add both scenes to build list.
6. `Player Settings`:
   - Package name (e.g. `com.company.hillclone`)
   - Minimum API according to your device.
7. Press `Build And Run` (debug build).
