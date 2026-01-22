# 遊行神3D

> 基於日本陰陽道學術研究，將平安時代的時空禁忌轉化為現代瀏覽器中的 3D 視覺藝術。

**[Live Demo](https://d1210182010.github.io/onmyodo-compass-calendar/)**

使用滑桿或播放按鈕觀察神煞的移動。

### Languages

**[中文 (Chinese)](#關於本專案)** | **[日本語 (Japanese)](#プロジェクトについて)** | **[English](#project-overview)**

---

## 關於本專案

在千年前的日本平安時代，陰陽師是隸屬於「陰陽寮」的國家公務員。他們的職責包括觀測天文、制定曆法，以及推算每日的吉凶方位神煞 。

本專案基於中村璋八教授的《日本陰陽道書之研究》 ，將古籍（如《陰陽雜書》、《曆林問答集》）中複雜難懂的曆注演算法，透過 WebGL 技術還原為一個互動式的 3D 天球羅盤 。

透過此工具，使用者可以直觀地看見那些曾經支配平安貴族生活的「神煞」，如何在時間長河中移動、升天或入地。

### 核心功能

* **3D 沉浸式羅盤**：使用 Three.js 建構，立體呈現方位宇宙觀。
* **神煞動態演繹**：
  * **天一神**：視覺化其在八方遊行的軌跡，以及在「天一天上」期間垂直升空的動態 。
  * **土公神**：模擬「歸土」現象（大土/小土日），神煞沉入地底變暗，象徵動土禁忌 。
  * **日遊神**：呈現其在「宮內（屋內）」與「出遊」間的切換 。
* **時光導航**：透過互動滑桿，即時預覽過去與未來的神煞位置。

### 視覺指南

| 視覺元素 | 神煞名稱 | 象徵意義與動態 |
| --- | --- | --- |
| **金色八面體** | **天一神** | 吉神。通常在圓周遊行。當祂升至羅盤頂端時，代表「天一天上」期間，人間百無禁忌 。 |
| **土色圓球** | **土公神** | 土地神。平時浮於羅盤上。當祂變深色並沉入盤面下時，代表「土公歸土」，嚴禁動土 。 |
| **紅色方塊** | **日遊神** | 凶神。當祂出現在內圈時，代表在「家中」，對應方位不可安床或掃除 。 |
| **紫色尖錐** | **大將軍** | 三年不動之凶神。長期佔據一個方位，該方位三年內不可修造 。 |
| **黑色叉號** | **金神** | 七殺凶神。極具殺傷力的方位，絕對不可犯 。 |

### 參考文獻

本專案之曆法算法與神煞邏輯，嚴謹考據自以下學術著作：

* **中村璋八 著，《日本陰陽道書の研究》**（汲古書院） 


  * 依據篇章：《陰陽雜書》 、《曆林問答集》 、《吉日考秘傳》 、《占事略決》 。





---

## プロジェクトについて

平安時代の日本において、陰陽師は陰陽寮に属する官僚であり、天文観測、暦の作成、そして日々の吉凶や神殺の方位推算を職務としていました 。

本プロジェクトは、中村璋八教授の『日本陰陽道書の研究』 に基づき、古文献（『陰陽雑書』、『暦林問答集』など）に記された複雑な暦注アルゴリズムを、現代のWebGL技術を用いてインタラクティブな 3D天球羅盤 として再現したものです 。

かつて貴族たちの生活を支配していた「神殺（神煞）」が、時間の流れの中でどのように移動し、天に昇り、あるいは地に潜るのかを、視覚的に体験することができます。

**[Live Demo](https://d1210182010.github.io/onmyodo-compass-calendar/)**

スライダーまたは再生ボタンを使用して、神殺の動きを観察してください。

### 主な機能

* **3D インタラクティブ羅盤**：Three.js を使用し、方位宇宙観を立体的に構築。
* **神殺の動態シミュレーション**：
* **天一神**：八方を遊行する様子と、「天一天上」期間における天への垂直上昇を可視化 。
* **土公神**：「土に帰る」現象（大土・小土の日）を再現。地下に沈み暗くなることで、動土禁忌を示す 。
* **日遊神**：「宮内（屋内）」と「出遊」の切り替えを表現 。
* **時間ナビゲーション**：スライダー操作により、過去や未来の神殺の位置を即座にプレビュー可能。
* **ビジュアルテーマ**：高コントラストな「玄夜（ダークモード）」と伝統的な「素紙（ライトモード）」を切り替え可能。

### ビジュアルガイド

| 視覚要素 | 神名 | 意味と挙動 |
| --- | --- | --- |
| **金色の八面体** | **天一神** | 吉神。通常は円周上を移動する。羅盤の頂点に昇る時は「天一天上」を表し、この期間は方位の禁忌がないとされる 。 |
| **土色の球体** | **土公神** | 土地神。通常は羅盤の上に浮遊している。色が濃くなり盤面下に沈む時は「土公帰蔵」を表し、動土は厳禁とされる 。 |
| **赤色の立方体** | **日遊神** | 凶神。内円に現れる時は「家中」に在り、その方位での掃除や安床は不可とされる 。 |
| **紫色の円錐** | **大将軍** | 三年塞がりの凶神。長期間特定の方位に居座り、その方位での修造は三年間禁止される 。 |
| **黒色の十字** | **金神** | 七殺の凶神。極めて強い殺気を持つ方位であり、決して犯してはならない 。 |

### 参考文献

本プロジェクトのアルゴリズムおよび神殺の論理は、以下の学術書に厳密に基づいています。

* **中村璋八 著、『日本陰陽道書の研究』**（汲古書院） 
  * 依拠文献：《陰陽雑書》 、《暦林問答集》 、《吉日考秘伝》 、《占事略決》 。





---

## Project Overview

In the Heian period of Japan, Onmyoji (Yin-Yang masters) served as government officials within the Onmyo-ryo (Bureau of Onmyo). Their primary duties included astronomical observation, calendar creation, and the calculation of daily directional taboos.

This project reconstructs these complex historical algorithms based on the research of Professor Nakamura Shouhachi (*A Study of Japanese Onmyodo Books*). By utilizing modern WebGL technology, it translates text-based rules from ancient manuscripts—such as *Onmyo Zassho* and *Rekirin Mondo-shu*—into an interactive 3D celestial compass.

This tool visualizes the movement, ascent, and descent of various deities within the sexagenary cycle, providing a spatial understanding of ancient temporal prohibitions.

**[Live Demo](https://d1210182010.github.io/onmyodo-compass-calendar/)**

Use the slider or play button to observe the movement of the deities.

### Key Features

* **3D Interactive Compass**: Built with Three.js to render a spatial representation of directional cosmology.
* **Deity Dynamics Simulation**:
* **Tenichijin (Heavenly One)**: Visualizes the deity's cycle of wandering the eight directions and its ascent to the zenith during the "Tenichi Tenjo" period (a period free of directional taboos).
* **Dokojin (Earth Deity)**: Simulates the "Returning to Earth" phenomenon during specific periods (Otsuchi/Kotsuchi), where ground-breaking activities were strictly prohibited.
* **Nichiyu**: Visualizes the deity's movement between the interior (house) and exterior.
* **Temporal Navigation**: An interactive timeline slider allows users to observe deity positions across past and future dates.
* **Visual Themes**: Supports both High-contrast Dark Mode and Traditional Light Mode.

### Visual Guide

The visualization uses specific geometric forms to represent different deities and their states:

| Visual Element | Deity Name | Significance & Behavior |
| --- | --- | --- |
| **Gold Octahedron** | **Tenichijin** | An auspicious deity. Moves along the compass perimeter. Ascends to the top of the Z-axis during the "Tenichi Tenjo" period. |
| **Earth Sphere** | **Dokojin** | The Earth deity. Usually floats above the compass. Sinks below the plane and darkens during "Earth periods," indicating a prohibition on earthworks. |
| **Red Cube** | **Nichiyu** | A deity of directional taboos. Moves to the inner circle when present inside the residence (prohibiting cleaning or bed positioning in that sector). |
| **Purple Cone** | **Taishogun** | A major directional taboo deity. Remains stationary in one cardinal direction for three-year cycles. |
| **Black Cross** | **Konjin** | The Seven-Kill deity. Indicates highly inauspicious directions for the year. |

### References

The algorithms and logic for the directional deities are based on the following academic work:

* Nakamura, Shouhachi. (1985). *Nihon Onmyodosho no Kenkyu* (A Study of Japanese Onmyodo Books). Kyuko Shoin. 
  * Primary sources analyzed include: *Onmyo Zassho* , *Rekirin Mondo-shu* , *Nichiji-ko Hiden* , and *Senji Ryakketsu*.


