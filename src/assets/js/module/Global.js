const PI = Math.PI;

export class Global {
  /**
   * 線形補間
   * リファレンス：https://ja.wikipedia.org/wiki/%E7%B7%9A%E5%BD%A2%E8%A3%9C%E9%96%93
   * @param {number} start
   * @param {number} end
   * @param {number} ease
   * @returns {number} startとendを補完した数値
   */
  lerp(start, end, ease) {
    return start * (1 - ease) + end * ease;
  }

  /**
   * 範囲を超えさせない
   * @param {number} num // 指定値
   * @param {number} min // 最小値
   * @param {number} max // 最大値
   * @return {number}
   */
  clamp(num, min, max) {
    return min > num ? min : max < num ? max : num;
  }

  /**
   * 範囲を超えると反対の端点にする
   * @param {number} num // 指定値
   * @param {number} min // 最小値
   * @param {number} max // 最大値
   * @return {number}
   */
  hoop(num, min, max) {
    const range = max - min + 1;
    let mod = (num - min) % range;
    if (0 > mod) {
      mod = range + mod;
    }
    return mod + min;
  }

  /**
   * 範囲ランダム数値生成
   * @param {number} min // 最小値
   * @param {number} max // 最大値
   * @returns
   */
  getClampRandom(min, max) {
    return Math.random() * (max - min) + min;
  }

  /**
   * 度数からラジアンに変換
   * @param {number} degree // 度数
   * @returns 弧度法のラジアンを返す
   */
  getDegreeToRadian(degree) {
    const radian = (degree * PI) / 180;
    return radian;
  }

  /**
   * ラジアンから度数に変換
   * @param {number} radians // 角度
   * @returns 弧度法のラジアンを返す
   */
  getRadianToDegree(radian) {
    const degree = (radian * 180) / PI;
    return degree;
  }

  getVector2Normalize(x, y) {
    const vector = { x: 0, y: 0 };

    // ベクトルの大きさ(長さ)を取得
    const length = Math.sqrt(x * x + y * y);

    // ベクトルを単位化
    if (length === 0.0) {
      vector.x = 0.0;
      vector.y = 0.0;
    } else {
      vector.x = x / length;
      vector.y = y / length;
    }
    return vector;
  }

  getVector3Normalize(x, y, z) {
    const vector = { x: 0, y: 0, z: 0 };

    // ベクトルの大きさ(長さ)を取得
    const length = Math.sqrt(x * x + y * y + z * z);

    // ベクトルを単位化
    if (length === 0.0) {
      vector.x = 0.0;
      vector.y = 0.0;
      vector.z = 0.0;
    } else {
      vector.x = x / length;
      vector.y = y / length;
      vector.z = z / length;
    }
    return vector;
  }

  /**
   * 遅延 (await)
   * @param {number} time 遅延時間
   * @returns
   */
  delay(time) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  }

  /**
   * GETパラメータのキーから値を取得し返す
   * 参考サイト：https://www-creators.com/archives/4463
   * @param {string} name // 取得したいGETパラメータのキー
   * @returns {string} // GETパラメータ値
   */
  getParameter(name) {
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  }
}
