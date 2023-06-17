// --------------------------

// lib

// --------------------------
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

// --------------------------

// module

// --------------------------
import { PostProcessing } from "./PostProcessing";
import { Color } from "./utility/Color";

const PI = Math.PI;
const DISTANCE = 1.25;
const LENGTH_MAX = 30;

export class Mesh {
  constructor(body, params, bool, stage) {
    this.body = body;
    this.stage = stage;
    this.params = params;
    this.bool = bool;

    // 進捗
    this.progress = {
      directionRotation: 0, // 左右に回転する進行方向
      speed: 0.01, // 進行方向へのスピード
    };

    // 地球
    this.earthGroup = null;
    this.earth = null;

    // 雲
    this.cloudGroup = null;
    this.cloud = null;

    // ブリキ飛行機
    this.tinPlaneGroup = null;
    this.tinPlane = null;
    this.propeller = null;

    this.isLoaded = false;

    this.glbLoader = new GLTFLoader();
    this.glbLoader.setMeshoptDecoder(MeshoptDecoder);

    this.pp = new PostProcessing(stage, params, bool);

    this.loadingObject = document.getElementById("js-loadingObject");
    this.loadingText = document.getElementById("js-loadingText");

    this.setDomBtns();
    this.init();
  }

  setDomBtns() {
    const DURATION = 2;
    const EASE = "power4.inOut";

    this.isClickViewBtn = true;
    this.value = {
      frontView: 0.0,
      backView: 1.0,
      initView: 0.0,
    };

    this.isFrontView = this.value.frontView === 1.0;
    this.isBackView = this.value.backView === 1.0;
    this.isInitView = this.value.initView === 1.0;

    // --------------------------

    // コントローラー: 視野

    // --------------------------
    this.frontViewBtn = document.getElementById("js-frontViewBtn");
    this.backViewBtn = document.getElementById("js-backViewBtn");
    this.initViewBtn = document.getElementById("js-initViewBtn");
    this.frontViewBtn.addEventListener("click", (e) => {
      if (this.isClickViewBtn) {
        this.isClickViewBtn = false;

        this.isFrontView = true;
        this.isBackView = false;
        this.isInitView = false;

        this.body.setAttribute("data-view", "front");

        GSAP.to(this.value, DURATION, {
          frontView: 1.0,
          backView: 0.0,
          initView: 0.0,
          ease: EASE,
          onComplete: () => {
            this.isClickViewBtn = true;
          },
        });
      }
    });

    this.backViewBtn.addEventListener("click", (e) => {
      if (this.isClickViewBtn) {
        this.isClickViewBtn = false;

        this.isFrontView = false;
        this.isBackView = true;
        this.isInitView = false;

        this.body.setAttribute("data-view", "back");

        GSAP.to(this.value, DURATION, {
          backView: 1.0,
          frontView: 0.0,
          initView: 0.0,
          ease: EASE,
          onComplete: () => {
            this.isClickViewBtn = true;
          },
        });
      }
    });

    this.initViewBtn.addEventListener("click", (e) => {
      if (this.isClickViewBtn) {
        this.isClickViewBtn = false;

        this.isFrontView = false;
        this.isBackView = false;
        this.isInitView = true;

        this.body.setAttribute("data-view", "init");

        this.isInitView = true;
        GSAP.to(this.value, DURATION, {
          initView: 1.0,
          backView: 0.0,
          frontView: 0.0,
          ease: EASE,
          onComplete: () => {
            this.isClickViewBtn = true;
          },
        });
      }
    });

    // --------------------------

    // コントローラー: 回転、スピード

    // --------------------------
    const toKeyDownDirection = (value) => {
      GSAP.to(this.progress, 1, {
        ease: "power2.inOut",
        directionRotation: value,
      });

      GSAP.to(this.tinPlane.scene.rotation, 1, {
        ease: "power2.inOut",
        y: G.getDegreeToRadian(24 * value),
      });
    };
    const toKeyUpDirection = () => {
      GSAP.to(this.progress, 1, {
        ease: "power2.inOut",
        directionRotation: 0,
      });

      GSAP.to(this.tinPlane.scene.rotation, 2, {
        ease: "power2.inOut",
        y: 0,
      });
    };
    const toKeyDownSpeed = (value) => {
      GSAP.to(this.progress, 1, {
        ease: "power2.inOut",
        speed: value,
      });
    };
    const toKeyUpSpeed = () => {
      GSAP.to(this.progress, 1, {
        ease: "power2.inOut",
        speed: 0.01,
      });
    };

    this.keyBtnList = [...document.querySelectorAll(".js-key")];
    for (let i = 0; i < this.keyBtnList.length; i++) {
      const ele = this.keyBtnList[i];
      ele.addEventListener("mousedown", (e) => {
        const key = ele.getAttribute("data-key");
        switch (key) {
          case "ArrowRight": // 右
            toKeyDownDirection(1);
            break;
          case "ArrowUp": // 上
            toKeyDownSpeed(0.02);
            break;
          case "ArrowLeft": // 左
            toKeyDownDirection(-1);
            break;
          default:
            break;
        }
      });
      ele.addEventListener("touchstart", (e) => {
        const key = ele.getAttribute("data-key");
        switch (key) {
          case "ArrowRight": // 右
            toKeyDownDirection(1);
            break;
          case "ArrowUp": // 上
            toKeyDownSpeed(0.02);
            break;
          case "ArrowLeft": // 左
            toKeyDownDirection(-1);
            break;
          default:
            break;
        }
      });
      ele.addEventListener("mouseup", (e) => {
        const key = ele.getAttribute("data-key");
        switch (key) {
          case "ArrowRight": // 右
          case "ArrowLeft": // 左
            toKeyUpDirection();
            break;
          case "ArrowUp": // 上
            toKeyUpSpeed();
            break;
        }
      });
      ele.addEventListener("touchend", (e) => {
        const key = ele.getAttribute("data-key");
        switch (key) {
          case "ArrowRight": // 右
          case "ArrowLeft": // 左
            toKeyUpDirection();
            break;
          case "ArrowUp": // 上
            toKeyUpSpeed();
            break;
        }
      });
    }

    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "ArrowRight": // 右
          toKeyDownDirection(1);
          break;
        case "ArrowUp": // 上
          toKeyDownSpeed(0.02);
          break;
        case "ArrowLeft": // 左
          toKeyDownDirection(-1);
          break;
        default:
          break;
      }
    });
    window.addEventListener("keyup", (e) => {
      switch (e.key) {
        case "ArrowRight": // 右
        case "ArrowLeft": // 左
          toKeyUpDirection();
          break;
        case "ArrowUp": // 上
          toKeyUpSpeed();
          break;
      }
    });
  }

  /**
   * モデル読み込み
   * @param {path} path // モデルのパス情報
   * @returns 3dモデルのSceneデータ
   */
  getLoadGlb(path) {
    return this.glbLoader.loadAsync(path);
  }

  async init() {
    this.setLight();

    // ポストプロセッシング初期化
    this.pp.init();

    // group初期化
    this.setEarthGroup();
    this.setCloudGroup();
    this.setTinPlaneGroup();

    await G.delay(100);

    this.loadingText.innerHTML = "25";
    this.loadingObject.setAttribute("data-progress", 2);

    // 雲読み込み
    this.cloud = await this.getLoadGlb("assets/model/cloud-meshopt.glb");
    this.setClouds();

    this.loadingText.innerHTML = "50";
    this.loadingObject.setAttribute("data-progress", 3);

    // 地球読み込み
    this.earth = await this.getLoadGlb("assets/model/world-meshopt.glb");
    this.setEarth();

    this.loadingText.innerHTML = "75";
    this.loadingObject.setAttribute("data-progress", 4);

    // ブリキ飛行機読み込み
    this.tinPlane = await this.getLoadGlb("assets/model/tin-plane-meshopt.glb");
    this.setTinPlane();

    this.loadingText.innerHTML = "100";
    this.loadingObject.setAttribute("data-progress", 5);

    await G.delay(300);
    this.isLoaded = true;
    this.body.setAttribute("data-loaded", "1");

    await G.delay(100);

    await this.pp.toEnterAnimation();
    this.body.setAttribute("data-status", "enter");

    await G.delay(250);
    this.initViewBtn.click();
  }

  setEarthGroup() {
    this.earthGroup = new THREE.Group();
    this.earthGroup.rotation.z = G.getDegreeToRadian(-23.4); // 地球の自転の傾きは約23.4度らしい
    this.stage.scene.add(this.earthGroup);
  }

  setEarth() {
    this.earth.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    this.earthGroup.add(this.earth.scene);
  }

  setCloudGroup() {
    this.cloudGroup = new THREE.Group();
    this.stage.scene.add(this.cloudGroup);
  }

  setClouds() {
    this.cloud.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    for (let i = 0; i < LENGTH_MAX; i++) {
      const cloud = this.cloud.scene.clone();

      const scale = G.getClampRandom(0.04, 0.1);
      const scaleX = scale;
      const scaleY = scale * 0.8;
      const scaleZ = scale * 0.8;
      cloud.scale.set(scaleX, scaleY, scaleZ);

      cloud.children[0].material.transparent = true;
      cloud.children[0].material.opacity = 1 - 1 * scaleX - 0.1;

      // データを格納する
      cloud.degree = new THREE.Vector2(
        G.getClampRandom(0, 360),
        G.getClampRandom(0, 360)
      ); // 角度
      cloud.progress = G.getClampRandom(0.5, 2); // 進捗
      cloud.leave = G.getClampRandom(1, 1.15); // DISTANCEから離れる係数
      cloud.direction = new THREE.Vector3(0, 1, 0); // ベクトルの向き

      const tl = GSAP.timeline({
        repeat: -1,
        repeatDelay: 0,
        yoyo: true,
        defaults: {
          duration: 10 * cloud.progress,
          ease: "power4.inOut",
        },
      });

      tl.to(cloud.scale, {
        x: scaleX,
        y: scaleY,
        z: scaleZ,
      })
        .to(cloud.scale, {
          x: scaleX * 0.5,
          y: scaleX * 0.5,
          z: scaleX * 0.5,
        })
        .to(cloud.scale, {
          x: scaleX,
          y: scaleY,
          z: scaleZ,
        });

      this.cloudGroup.add(cloud);
    }

    this.updateClouds();
  }

  updateClouds(time = 0) {
    for (let i = 0; i < this.cloudGroup.children.length; i++) {
      const cloud = this.cloudGroup.children[i];

      // データを格納する
      const prevPosition = cloud.position; // 更新前の位置情報
      const degree = cloud.degree; // 角度
      const leave = cloud.leave; // DISTANCEから離れる係数
      const progress = cloud.progress * time; // 進捗アニメーション

      // 位置を設定
      const phi = 2 * Math.PI * G.getDegreeToRadian(degree.x + progress); // 緯度
      const theta = Math.PI * G.getDegreeToRadian(degree.y); // 経度
      const x = Math.cos(phi) * Math.cos(theta);
      const y = Math.sin(phi);
      const z = Math.cos(phi) * Math.sin(theta);

      // 位置情報を格納する
      const position = new THREE.Vector3(x, y, z);

      // ▼ クォータニオン ▼
      // 更新前の向き先を格納する
      const prevDirection = cloud.direction.clone().normalize();

      // (終点 - 始点)から2点を結ぶベクトルを定義する
      cloud.direction = new THREE.Vector3().subVectors(position, prevPosition);

      // 更新後のベクトルを単位化する
      cloud.direction.normalize();
      position.normalize();

      // 位置を更新する
      cloud.position.set(
        x * DISTANCE * leave,
        y * DISTANCE * leave,
        z * DISTANCE * leave
      );

      // 回転するための軸を外積で法線ベクトルを取得し単位化する
      const normalAxis = new THREE.Vector3().crossVectors(
        prevDirection,
        cloud.direction
      );
      normalAxis.normalize();

      // 内積でコサインを取得する
      const cos = prevDirection.dot(cloud.direction);

      // コサインをラジアンに変換する
      const radian = Math.acos(cos);

      // クォータニオンを定義する
      const qtn = new THREE.Quaternion().setFromAxisAngle(normalAxis, radian);

      // 元のクォータニオンに新しいクォータニオンを掛け混ぜて更新する
      cloud.quaternion.premultiply(qtn);

      // 最新のベクトルのスカラーを2倍にして進行方向を向くようにする
      cloud.lookAt(cloud.direction.multiplyScalar(2));

      // 常にYアップにする(オブジェクト原点)
      cloud.up = new THREE.Vector3(0, 1, 0).applyQuaternion(cloud.quaternion);
    }
  }

  setTinPlaneGroup() {
    this.tinPlaneGroup = new THREE.Group();
    this.tinPlaneGroup.position.set(DISTANCE, 0, 0); // 初期位置
    this.tinPlaneGroup.direction = new THREE.Vector3(0, 1, 0); // 初期位置から進行方向のベクトルを設定
    this.stage.scene.add(this.tinPlaneGroup);
  }

  setTinPlane() {
    this.tinPlane.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
      if (child.name === "立方体003") {
        this.propeller = child;
      }
    });

    const scale = 0.025;
    this.tinPlane.scene.scale.set(scale, scale, scale);
    this.tinPlaneGroup.add(this.tinPlane.scene);
    this.updateTinPlane();
  }

  updateTinPlane() {
    // 更新前の位置情報、ベクトル情報を保持する
    const prevDirection = this.tinPlaneGroup.direction.clone();
    const prevPosition = this.tinPlaneGroup.position.clone();

    // 進行方向を回転させるためのベクトルを定義する
    const rotationDirection = new THREE.Vector3();
    // 外積(クロス積)を使用して進行方向を左右に回転できるようにする
    rotationDirection.crossVectors(this.tinPlaneGroup.direction, prevPosition);
    // 単位化する
    rotationDirection.normalize();

    // 現在のベクトルに進行方向になる法線ベクトルを小さくして加算して進める
    this.tinPlaneGroup.direction.add(
      rotationDirection.multiplyScalar(
        this.progress.speed * this.progress.directionRotation // -1 ~ 0 ~ 1 (左 ~ 前方 ~ 右)
      )
    );

    // 更新前のベクトルに進行方向のベクトルを小さくして加算して進める
    const position = prevPosition.add(
      this.tinPlaneGroup.direction.multiplyScalar(this.progress.speed)
    );

    // 更新後のベクトルを単位化する
    position.normalize();

    // 単位化したベクトルに大きさ(ワールド原点からの任意の距離)を加算する
    position.multiplyScalar(DISTANCE);

    // (終点 - 始点)から2点を結ぶベクトルを定義する
    this.tinPlaneGroup.direction = new THREE.Vector3().subVectors(
      position,
      this.tinPlaneGroup.position
    );
    // 更新後のベクトルを単位化する
    this.tinPlaneGroup.direction.normalize();

    // 位置を更新する
    this.tinPlaneGroup.position.set(position.x, position.y, position.z);

    // 回転するための軸を外積で法線ベクトルを取得し単位化する
    const normalAxis = new THREE.Vector3().crossVectors(
      prevDirection,
      this.tinPlaneGroup.direction
    );
    normalAxis.normalize();

    // 内積でコサインを取得する
    const cos = prevDirection.dot(this.tinPlaneGroup.direction);

    // コサインをラジアンに変換する
    const radians = Math.acos(cos);

    // クォータニオンを定義する
    const qtn = new THREE.Quaternion().setFromAxisAngle(normalAxis, radians);

    // 元のクォータニオンに新しいクォータニオンを掛け混ぜて更新する
    this.tinPlaneGroup.quaternion.premultiply(qtn);
  }

  updateCamera() {
    // ブリキ飛行機をカメラの基準位置とする
    const position = this.tinPlaneGroup.position.clone();

    // 位置: バック視点
    const backValue = this.value.backView;
    const backDirection = this.tinPlaneGroup.direction
      .clone()
      .multiplyScalar(this.bool.isMatchMediaWidth ? -0.4 : -0.2); // ブリキ飛行機の進行方向とは逆の後方にベクトルのスカラーを伸ばして位置決めをする
    const backPosition = position.clone().add(backDirection); // バック視点になるように基準値に位置決めした値を加算する
    backPosition.normalize().multiplyScalar(DISTANCE * 1.2); // ベクトルを単位化し任意の位置になるようにスカラーを伸ばす
    const backLookAt = this.tinPlaneGroup.position;

    // 位置: フロント視点
    const frontValue = this.value.frontView;
    const frontDirection = this.tinPlaneGroup.direction
      .clone()
      .multiplyScalar(0.4); // ブリキ飛行機の進行方向の前方にベクトルのスカラーを伸ばして位置決めをする
    const frontPosition = position.clone().add(frontDirection);
    frontPosition.normalize().multiplyScalar(DISTANCE * 1.2); // ベクトルを単位化し任意の位置になるようにスカラーを伸ばす
    const frontLookAt = this.tinPlaneGroup.position;

    // 位置: デフォルト視点
    const initValue = this.value.initView;
    const initLookAt = new THREE.Vector3(0, 0, 0);

    // カメラ更新
    this.stage.camera.position.copy(
      new THREE.Vector3(
        0 * initValue +
          backPosition.x * backValue +
          frontPosition.x * frontValue,
        0 * initValue +
          backPosition.y * backValue +
          frontPosition.y * frontValue,
        (this.bool.isMatchMediaWidth ? 4 : 2.75) * initValue +
          backPosition.z * backValue +
          frontPosition.z * frontValue
      )
    );
    this.stage.camera.lookAt(
      initLookAt.x * initValue +
        backLookAt.x * backValue +
        frontLookAt.x * frontValue,
      initLookAt.y * initValue +
        backLookAt.y * backValue +
        frontLookAt.y * frontValue,
      initLookAt.z * initValue +
        backLookAt.z * backValue +
        frontLookAt.z * frontValue
    );
    this.stage.camera.up = new THREE.Vector3(
      this.stage.camera.position.x,
      this.stage.camera.position.y + 1 * initValue,
      this.stage.camera.position.z
    );
  }

  setLight() {
    const MAP_SIZE = 2048;

    // スポットライト1
    this.spotLight1 = new THREE.SpotLight(Color("#00ffcc"), 1.25);
    this.spotLight1.angle = PI / 6;
    this.spotLight1.penumbra = 1;
    this.spotLight1.decay = 2;
    this.spotLight1.castShadow = true;
    this.spotLight1.shadow.mapSize.width = MAP_SIZE;
    this.spotLight1.shadow.mapSize.height = MAP_SIZE;
    this.spotLight1.shadow.camera.near = 1;
    this.spotLight1.shadow.focus = 1;
    this.spotLight1.shadow.bias = -0.0001; // シャドウアクネ対策
    this.spotLight1.position.set(10, 12.25, 25);
    this.spotLight1.distance = 160;
    this.spotLight1.shadow.camera.far = 160;
    this.stage.scene.add(this.spotLight1);
    // if (MODE) {
    //   const spotLightHelper = new THREE.SpotLightHelper(this.spotLight1);
    //   this.stage.scene.add(spotLightHelper);
    // }

    // スポットライト2
    this.spotLight2 = new THREE.SpotLight(Color("#a3e0ff"), 1.25);
    this.spotLight2.angle = PI / -6;
    this.spotLight2.penumbra = 1;
    this.spotLight2.decay = 2;
    this.spotLight2.castShadow = true;
    this.spotLight2.shadow.mapSize.width = MAP_SIZE;
    this.spotLight2.shadow.mapSize.height = MAP_SIZE;
    this.spotLight2.shadow.camera.near = 1;
    this.spotLight2.shadow.focus = 1;
    this.spotLight2.shadow.bias = -0.0001; // シャドウアクネ対策
    this.spotLight2.position.set(20, 15, 35);
    this.spotLight2.distance = 160;
    this.spotLight2.shadow.camera.far = 160;
    this.stage.scene.add(this.spotLight2);
    // if (MODE) {
    //   const spotLightHelper2 = new THREE.SpotLightHelper(this.spotLight2);
    //   this.stage.scene.add(spotLightHelper2);
    // }

    // アンビエントライト
    this.ambientLight = new THREE.AmbientLight(Color("#fff"), 0.2);
    this.stage.scene.add(this.ambientLight);

    if (GUI != null) {
      // アンビエントライト
      if (this.ambientLight) {
        const ambientlight = GUI.addFolder("ambientlight");
        ambientlight.close();
        ambientlight
          .addColor(this.ambientLight, "color")
          .name("color")
          .onChange((value) => {
            this.ambientLight.color = Color(value);
          });
        ambientlight
          .add(this.ambientLight, "intensity", 0.0, 1.0)
          .name("intensity")
          .onChange((value) => {
            this.ambientLight.intensity = value;
          });
      }

      // スポットライト1
      if (this.spotLight1) {
        const spotligth = GUI.addFolder("spotligth");
        spotligth.close();
        spotligth
          .addColor(this.spotLight1, "color")
          .name("color")
          .onChange((value) => {
            this.spotLight1.color = Color(value);
          });
        spotligth
          .add(this.spotLight1, "intensity", 0.0, 20.0)
          .name("intensity")
          .onChange((value) => {
            this.spotLight1.intensity = value;
          });
        spotligth
          .add(this.spotLight1, "penumbra", 0.0, 10.0)
          .name("penumbra")
          .onChange((value) => {
            this.spotLight1.penumbra = value;
          });
        spotligth
          .add(this.spotLight1, "decay", 0.0, 10.0)
          .name("decay")
          .onChange((value) => {
            this.spotLight1.decay = value;
          });
        spotligth
          .add(this.spotLight1.shadow, "focus", 0.0, 10.0)
          .name("focus")
          .onChange((value) => {
            this.spotLight1.shadow.focus = value;
          });
        spotligth
          .add(this.spotLight1, "distance", 0.0, 200.0)
          .name("distance")
          .onChange((value) => {
            this.spotLight1.distance = value;
          });
        spotligth
          .add(this.spotLight1.shadow.camera, "far", 0.0, 200.0)
          .name("far")
          .onChange((value) => {
            this.spotLight1.shadow.camera.far = value;
          });
        spotligth
          .add(this.spotLight1.position, "x", 0.0, 100.0)
          .name("position.x")
          .onChange((value) => {
            this.spotLight1.position.x = value;
          });
        spotligth
          .add(this.spotLight1.position, "y", 0.0, 100.0)
          .name("position.y")
          .onChange((value) => {
            this.spotLight1.position.y = value;
          });
        spotligth
          .add(this.spotLight1.position, "z", 0.0, 100.0)
          .name("position.z")
          .onChange((value) => {
            this.spotLight1.position.z = value;
          });
      }

      // スポットライト2
      if (this.spotLight2) {
        const spotlight2 = GUI.addFolder("spotlight2");
        spotlight2.close();
        spotlight2
          .addColor(this.spotLight2, "color")
          .name("color")
          .onChange((value) => {
            this.spotLight2.color = Color(value);
          });
        spotlight2
          .add(this.spotLight2, "intensity", 0.0, 20.0)
          .name("intensity")
          .onChange((value) => {
            this.spotLight2.intensity = value;
          });
        spotlight2
          .add(this.spotLight2, "penumbra", 0.0, 10.0)
          .name("penumbra")
          .onChange((value) => {
            this.spotLight2.penumbra = value;
          });
        spotlight2
          .add(this.spotLight2, "decay", 0.0, 10.0)
          .name("decay")
          .onChange((value) => {
            this.spotLight2.decay = value;
          });
        spotlight2
          .add(this.spotLight2.shadow, "focus", 0.0, 10.0)
          .name("focus")
          .onChange((value) => {
            this.spotLight2.shadow.focus = value;
          });
        spotlight2
          .add(this.spotLight2, "distance", 0.0, 200.0)
          .name("distance")
          .onChange((value) => {
            this.spotLight2.distance = value;
          });
        spotlight2
          .add(this.spotLight2.shadow.camera, "far", 0.0, 200.0)
          .name("far")
          .onChange((value) => {
            this.spotLight2.shadow.camera.far = value;
          });
        spotlight2
          .add(this.spotLight2.position, "x", -100, 100.0)
          .name("position.x")
          .onChange((value) => {
            this.spotLight2.position.x = value;
          });
        spotlight2
          .add(this.spotLight2.position, "y", -100, 100.0)
          .name("position.y")
          .onChange((value) => {
            this.spotLight2.position.y = value;
          });
        spotlight2
          .add(this.spotLight2.position, "z", -100, 100.0)
          .name("position.z")
          .onChange((value) => {
            this.spotLight2.position.z = value;
          });
      }
    }
  }

  resize(props) {
    // this.bool.isMatchMediaWidth = props.isMatchMediaWidth;
  }

  raf(time) {
    // 雲
    if (this.cloudGroup != null) {
      if (this.cloudGroup.children.length > 0) {
        this.updateClouds(time);
      }
    }

    // 地球の自転の回転
    if (this.earth != null) {
      const add = this.isInitView ? 0.003 : 0.001;
      this.earth.scene.rotation.y += add;
    }

    // 飛行機
    if (this.tinPlane != null) {
      this.updateTinPlane(time);

      if (this.propeller != null) {
        this.propeller.rotation.y += 1;
      }

      // カメラ
      this.updateCamera(time);
    }

    // this.stage.renderer.render(this.stage.scene, this.stage.camera);
    this.pp.raf();
  }
}
