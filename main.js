
let simpleLevelPlan = `
......................
..#................#..
..#..............=.#..
..#.........o.o....#..
..#.@......#####...#..
..#####............#..
......#++++++++++++#..
......##############..
......................`;

// xây dựng bản đồ
/*
    + input: 1 mô hình bản đồ dạng string
    + mỗi 1 bản đồ là 1 level
*/
var Level = class Level {
    constructor(plan) {
        let rows = plan.trim().split("\n").map(l => [...l]);  // nhận vào 1 mô hình bản đồ string -> loại bỏ các khoảng trắng thừa ở đầu và cuối string
                                                              // -> tách từng dòng thành 1 phần tử trong mảng qua kí tự "\n" -> duyệt từng phần tử : tại mỗi phần tử
                                                              // giải(...) string ra và nhóm lại thành 1 mảng với với mỗi phần tử là 1 kí tự
                                                              // cuối cùng ta sẽ có rows là 1 mảng 2 chiều dạng:
                                                              //rows = [[".",".",".",".",".",".","."],
                                                              //        [".","#",".",".",".","#","."],
                                                              //        ...]; 
        this.height = rows.length;                            // height: chiều dọc = số phần tử của rows 
        this.width = rows[0].length;                          // width: chiều ngang = số phần tử trong mỗi phần tử con của rows
        this.startActors = [];                                // danh sách các actors

        this.rows = rows.map((row, y) => {                    // duyệt rows từng phần tử row, y (index, số tt dòng)
            return row.map((ch, x) => {                       // tại mỗi row, duyệt từng phần tử ch, x(index, số tt cột)
                let type = levelChars[ch];                    // lưu lại loại kí tự (từ levelChars)
                if(typeof type == "string") return type;      // nếu là loại "string", giữ nguyên và trả về chính nó
                this.startActors.push(                        // nếu ko phải loại "string", đẩy vào startActors[]
                    type.create(new Vec(x, y), ch)            // tạo obj từ loại type, thêm Vec là vị trí của kí tự đó rồi push vào startActors[] 
                );
                return "empty";                               // trả về "empty" tương đương với "."
            });
        });
    }
}
/*
    + string.trim(): string; trả về 1 string đã loại bỏ tất cả các khoảng trắng ở đầu và cuối string(bao gồm cả " ", \t, \n, tab,...)
    + string.split("\n"): arr; trả về 1 arr bằng cách chia các phần tử cách nhau bằng kí tự "\n"
    + arr.map(l => [...l]): arr[][]: trả về 1 mảng có các phần tử là 1 mảng 
    + object.create(): nhận vào 2 tham số, thứ nhất là nguyên mẫu của đối tượng mới tạo thành, thứ 2 là 1 đối tượng tùy ý đc thêm vào đối tượng mới
*/

// trạng thái đối tượng
/*
    + input: level(bản đồ hiện tại), actors(đối tượng), status(trạng thái hiện tại ("playing", "won", "lost"))
*/
var State = class State {
  constructor(level, actors, status) {
    this.level = level;
    this.actors = actors;
    this.status = status;
  }

  static start(level) {                                      // hàm bắt đầu : input: level
    return new State(level, level.startActors, "playing");   // return 1 State mới chuyển các level.startActors thành trạng thái "playing" 
  }

  get player() {
    return this.actors.find(a => a.type == "player");        // tìm phần tử là "player"
  }

  get wall() {
    return this.actors.find(a => a.type == "wall");        // tìm phần tử là "wall"
  }
}

// vị trí dạng 2 chiều xy (vector)
/*
    + input: x, y
*/
var Vec = class Vec {
  constructor(x, y) {
    this.x = x; this.y = y;
  }
  plus(other) {                                             // từ vị trí đối tượng công thêm với kích thước của chúng
    return new Vec(this.x + other.x, this.y + other.y);
  }
  times(factor) {                                           // tốc độ dịch chuyển: lấy vị trí hiện tại x hệ số(factor)
    return new Vec(this.x * factor, this.y * factor);
  }
}

// người chơi
/*
    + input: vị trí(pos), tốc độ di chuyển(speed)
*/
var Player = class Player {
  constructor(pos, speed) {
    this.pos = pos;
    this.speed = speed;
  }

  get type() { return "player"; }    // loại: "player": người chơi

  static create(pos) {                               // hàm tạo: input là vị trí
    return new Player(pos.plus(new Vec(0, -0.5)),    // return: 1 class Player mới có vị trí đã xử lý kích thước(pos.plus), tốc độ Vec(0,0) 
                      new Vec(0, 0));
  }
}

Player.prototype.size = new Vec(0.8, 1.5);            // thuộc tính size của Player, có vec là 0,8 ngang, và 1.5 dọc (kích thước)

// dung nham
/*
    + input: vị trí(pos), tốc độ(speed), lặp lại(reset)
*/
var Lava = class Lava {
  constructor(pos, speed, reset) {
    this.pos = pos;
    this.speed = speed;
    this.reset = reset;
  }

  get type() { return "lava"; }      // loại: lava"": dung nham

  static create(pos, ch) {                       // hàm tạo: input: vị trí, loại dung nham
    if (ch == "=") {                             // nếu là loại "=", loại dung nham di chuyển đều chiều ngang 
      return new Lava(pos, new Vec(2, 0));       // cho di chuyển theo chiều ngang, dịch 2 đơn vị
    } else if (ch == "|") {                      // nếu là loại "|", loại dung nham di chuyển đều chiều dọc
      return new Lava(pos, new Vec(0, 2));       // cho di chuyển theo chiều dọc, dịch 2 đơn vị
    } else if (ch == "v") {                      // nếu là loại "v", dung nham nhỏ giọt
      return new Lava(pos, new Vec(0, 3), pos);  // cho di chuyển theo chiều dọc, dịch 3 đơn vị, reset lại vị trí ban đầu
    }
  }
}

Lava.prototype.size = new Vec(1, 1);              // size dung nham, 1,1

var Wall = class Wall {
    constructor(pos, speed, reset) {
      this.pos = pos;
      this.speed = speed;
      this.reset = reset;
    }
  
    get type() { return "wall"; }      // loại: Wall"": dung nham
  
    static create(pos, ch) {                       
        if (ch == "*") {                      // nếu là loại "|", loại dung nham di chuyển đều chiều dọc
            return new Wall(pos, new Vec(0, 2));       // cho di chuyển theo chiều dọc, dịch 2 đơn vị
        }
  }
}

Wall.prototype.size = new Vec(1, 1);              // size dung nham, 1,1
  

//tiền thưởng
/*
    + input: vị trí(pos), vị trí cơ bản(basePos), hiệu ứng "nhấp nhô"(wobble)
*/
var Coin = class Coin {
    constructor(pos, basePos, wobble) {
        this.pos = pos;
        this.basePos = basePos;
        this.wobble = wobble;
    }

    get type() {return "coin";}              // loại: tiền thưởng

    static create(pos) {                                                // hàm tạo: input vị trí
        let basePos = pos.plus(new Vec(0.2, 0.1));                      // vị trí cơ bản 
        return new Coin(basePos, basePos, Math.random() * Math.PI * 2); // return đối tượng Coin mới, có pos = basePos, basePos, wobble (random từ 0.00 -> 6.28)
    }
}

Coin.prototype.size = new Vec(0.6, 0.6);                   // kích thước coin (0.6, 0.6)

// định nghĩa các kí tự tương ứng với vai trò 
const levelChars = {
    ".": "empty",        // khoảng trống
    "#": "wall",         // tường
    "+": "lava",         // dung nham loại đứng yên
    "@": Player,         // người chơi
    "o": Coin,           // tiền
    "=": Lava,           // dung nham loại di chuyển ngang
    "|": Lava,           // dung nham loại di chuyển dọc
    "v": Lava,           // dung nham loại nhỏ giọi
    "*": Wall            // wall loại di chuyển lên xuống  
};

// let simpleLevel = new Level(simpleLevelPlan);
// console.log(`${simpleLevel.width} by ${simpleLevel.height}`);
// → 22 by 9

// hàm elt: có thể là (extract(trích xuất), transform(biến đổi), load(tải))
/*
    + input: name(tag cần selection), attrs (obj các thuộc tính cần thêm vào), ...children(rest: trả về Array) các tham số còn lại
*/
function elt(name, attrs, ...children) {
    let dom = document.createElement(name);      // selec vào tag name
    for(let attr of Object.keys(attrs)) {        // duyệt mảng các attributes
        dom.setAttribute(attr, attrs[attr]);     // thêm lần lượt các atti vào theo quy tắc
                                                 // tên attri là key, giá trị attr là giá trị của key đó    
    }
    for(let child of children) {     // duyệt các tham số còn lại
        dom.appendChild(child);       // thêm nó vào cuối tag name
    }
    return dom;                       // trả về dom, biến đại diện ccho tag name đã xử lý
}
/*
    + document.createElement(name): lấy các tag "name"
    + setAttribute(): thêm attribute vào tag
    + dom.appendChild(child); thêm 1 child vào dom
*/



// hàm tạo khối hiển thị 
/*
    + input : khối cha(parent), bản đồ(level)
*/
var DOMDisplay = class DOMDisplay {
    constructor(parent, level) {
        this.dom = elt("div", {class: "game"}, drawGrid(level));  // gán thuộc tính dom với giá trị hàm elt(tag div, class="game", hàm xử lý background(drawGrid))
        this.actorLayer = null;                                   // actorLayer thuộc tính theo dõi các actors để loại bỏ và thay thế
        parent.appendChild(this.dom);                             // thêm dom vào khối cha parent
    }

    clear() {                                                      // phương thức xóa
        this.dom.remove();                                         // loại bỏ elem
    }
}
/*
    + this.dom.remove(); loại bỏ dom
*/

const scale = 20;   // 1 đơn vị (ô lưới) trên màn hình = 20 px

// hàm xử lý html/css background
function drawGrid(level) {
    return elt(                                               // return về 1 elt gồm
            "table",                                          // tag table (dạng lưới)
            {
                class: "background",                          // class="background"
                style: `width: ${level.width * scale}px`      // css: lấy kích thước chiều ngang thực (width) x hệ số chuyển đổi (scale) đơn vị pixel
            },
            ...level.rows.map(row =>                         // (children) giải level.rows thành từng phần tử (...), mỗi phần tử là 1 mảng, duyệt chúng
                elt(
                    "tr",                                    // tag tr (hàng trong table)
                    {style: `height: ${scale}px`},           // css chiều cao (height) = scale px;
                    ...row.map(type => elt("td", {class: type}))   // giải(...) từng phần từ (thành từng kí tự), duyệt, mỗi kí tự là 1 elt(tag td(1 ô trong table), class="type")
                ))
            );
}

//hàm hiển thị text ()
// function textInfo(state) {
//     let numbersCoin = 0;
//     state.actors.map(m => {
//         if(m)
//     });
// }


// hàm xử lý html/css cho actors
/*
    + input: mảng actors [][]
*/
function drawActors(actors) { 
    return elt("div", {},                                         // selec vào tag div, {}
        ...actors.map(actor => {                                  // giải actors thành mảng con, duyệt từng phần tử
            let rect = elt("div", {class: `actor ${actor.type}`}); // mỗi phần tử là 1 elt(tag div, class="actor actor.type", )
            rect.style.width = `${actor.size.x * scale}px`;        // css width = (actor.size.x * scale) px;
            rect.style.height = `${actor.size.y * scale}px`;       // css height = (actor.size.y * scale) px;
            rect.style.left = `${actor.pos.x * scale}px`;          // css left = actor.pos.x * scale;
            rect.style.top = `${actor.pos.y * scale}px`;           // css right = actor.pos.y * scale;
            return rect;                                           // return 
        })
    )
}
/*
    + elem.style: thay đổi các thuộc tính css của elem
*/

// thêm phương thức "trạng thái đồng bộ" trong DOMDisplay
/*
    + input: trạng thái(state)
*/
DOMDisplay.prototype.syncState = function(state) {
    if(this.actorLayer) this.actorLayer.remove();     // nếu có trạng thái cũ của đối tượng(actorLayer), xóa nó
    this.actorLayer = drawActors(state.actors);       // tạo lại trạng thái mới cho actor
    this.dom.appendChild(this.actorLayer);            // thêm nó vào cuối dom (trong class="game")
    this.dom.className = `game ${state.status}`;      // thêm tên class cho đối tượng dom class="game state.status("playing","won","lost")"
    this.scrollPlayerIntoView(state);                 // 
}
/*
    + elem.className; đặt tên class cho đối tượng
*/

DOMDisplay.prototype.textInfo = function(level, state) {
    let numberCoin = level.startActors.filter(c => c.type == "coin").length;
    let getCoin = state.actors.filter(c => c.type == "coin").length;
    if(getCoin == 0) {
        ++rankLevel;
    }
    document.getElementById("point").innerHTML = `Coin: ${numberCoin-getCoin}/${numberCoin}`;
}

// phương thức thay đổi tầm nhìn game
/*
    + giải nghĩa: map chơi rất rộng, ng chơi sẽ ko nhìn thấy toàn bộ map mà chỉ nhìn qua
        khung nhìn (600px x 450px), vì thế, khi actor: player đi chuyển , giao diện nhìn cũng sẽ thay đổi bằng cách kéo 
        các thanh scrollLeft và scrollTop
    + input: trạng thái(state)
*/
DOMDisplay.prototype.scrollPlayerIntoView = function(state) {
    let width = this.dom.clientWidth;              // width = 600px
    let height = this.dom.clientHeight;            // height = 450px
    let margin = width / 3;                        // margin = wight / 3 = 200px

    // tầm nhìn
    let left = this.dom.scrollLeft;                // left = giá trị thanh cuộn ngang (0px khi cuộn ngang ở sát phải)
    let right = left + width;                      // right = giá trị tính từ vị trí cuộn ngang(scrollLeft) + tầm nhìn ngang (width)

    let top = this.dom.scrollTop;                  // top = giá trị thanh cuộn dọc (0px khi cuộn dọc ở sát trên)
    let bottom = top + height;                     // bottom = giá trị tính từ vị trí cuộn dọc(scrollTop) + tầm nhìn dọc (height)

    let player = state.player;                     // biến đại diện ng chơi
    let center = player.pos.plus(player.size.times(0.5)).times(scale);  // tầm nhìn tính từ ng chơi (vị trí + (kích thước * 0.5))*scale

    if(center.x < left + margin) {                     // nếu tầm nhìn về bên trái nhỏ hơn 200px, đẩy scrollLeft về trái 1 đoạn (center.x - margin)      
        this.dom.scrollLeft = center.x - margin;
    } else if(center.x > right - margin) {             // nếu tầm nhìn về bên phải lớn hơn right - margin
        this.dom.scrollLeft = center.x + margin - width;
    }

    if(center.y < top + margin) {                        // tầm nhìn về trên
        this.dom.scrollTop = center.y - margin;
    } else if(center.y > bottom - margin) {               // tầm nhìn bên dưới
        this.dom.scrollTop = center.y + margin - height;
    }
}
/*
    + offsetWidth, offsetHeight: Kích thước của hộp trực quan bao gồm tất cả các đường viền.
        Có thể được tính bằng cách thêm width/ heightvà paddings và viền, 
        nếu phần tử có display: block
    + clientWidth, clientHeight: Phần trực quan của nội dung hộp,
        không bao gồm viền hoặc thanh cuộn, nhưng bao gồm phần đệm. 
        Không thể tính trực tiếp từ CSS, tùy thuộc vào kích thước 
        thanh cuộn của hệ thống.
    + scrollWidth, scrollHeight: Kích thước của tất cả nội dung của hộp, bao gồm các phần
        hiện bị ẩn bên ngoài khu vực cuộn. 
        Không thể được tính trực tiếp từ CSS, tùy thuộc vào nội dung.
    + scrollLeft: trả về số pixel nội dung đc cuộn theo chiều ngang (0px khi scroll ngang đang ở vị trí sát phải)
    + scrollTop:  trả về số pixel nội dung đc cuộn theo chiều dọc (0px khi scroll dọc đang ở vị trí sát trên cùng)
*/

// kiểm tra vị trí với wall và dung nham
/*
    + input: vị trí(pos), kích thước(size), loại actor(type)
*/
Level.prototype.touches = function(pos, size, type) {
    let xStart = Math.floor(pos.x);              //      x,y start  ---------------------> x end
    let xEnd = Math.ceil(pos.x + size.x);        //                 | 
    let yStart = Math.floor(pos.y);              //                 |
    let yEnd = Math.ceil(pos.y + size.y);         //                | 
                                                 //                 v y end 

    for(let y = yStart; y <yEnd; y ++) {          // chạy từ trên xuống dưới (đơn vị 1px)
        for(let x = xStart; x < xEnd; x ++) {      // chạy từ trái sang phải (đơn vị 1px)
            let here;
            if(y < 0) {
                here = "wall";                     // nếu như chạm sát cạnh trên cùng thì coi như chạm tường
            } else {
                let isOutside = x < 0 || x >= this.width ||     // trường hợp chạm cạnh khác
                                y >= this.height ;      
                here = isOutside ? "lava" : this.rows[y][x];    // nếu đúng thì coi như chạm dung nham, nếu sai thì lưu lại 
            }
            if(here == type) return true;                     // return true nếu đúng loại cần kiểm tra
        }
    }
    return false;                                             // return false nếu ko phải loại đang check 
}

/*
    + math.floor(); làm tròn xuống (5.95 -> 5, 5.05 -> 5, -5.05 -> -6)
    + math.ceil(); làm tròn lên (5.95 -> 6, 5.05 -> 6, -5.05 -> -5)
*/

// thuộc tính cập nhập trạng thái va chạm với lava và các actor khác
/*
    + input: time(thời gian request), keys(thao tác phím)
*/
State.prototype.update = function(time, keys) {

    let actors = this.actors
    .map(actor => actor.update(time, this, keys));    // cập nhập các trạng thái của tất cả các actor

    let newState = new State(this.level, actors, this.status);   // gán lại actors đã update vào 1 newState

    if (newState.status != "playing") return newState;          // nếu status đang khác trạng thái "playing" trả về newState
    let player = newState.player;                               // nếu đang ở trạng thái "playing", gán biến đại diện người chơi(player)

    if(this.level.touches(player.pos, player.size, "lava")) {    // nếu có va chạm player với lava(dạng đứng yên)
        return new State(this.level, actors, "lost");            // trả về trạng thái "lost"
    }
                                                                // nếu ko có va chạm giữa player với lava
    for(let actor of actors) {                                  // duyệt các đối tượng 
        if(actor != player && overlap(actor, player)) {         // nếu đối tượng khác player và đang xảy ra va chạm với player (coin-player, lava(dạng di chuyển)-player)
            newState = actor.collide(newState);                 // xử lý va chạm của đối tượng đó
        }
    }
    return newState;                                             // trả về newState
};

// nhận va chạm giữa 2 actor
/*
    + input : actor1, actor2
*/
function overlap(actor1, actor2) {
    return actor1.pos.x + actor1.size.x > actor2.pos.x &&     //
           actor1.pos.x < actor2.pos.x + actor2.size.x &&     // chiều ngang chạm nhau
           actor1.pos.y + actor1.size.y > actor2.pos.y &&     // 
           actor1.pos.y < actor2.pos.y + actor2.size.y;       // chiều dọc chạm nhau
                                                              // return true nếu chạm. false nếu ko
}

// chạm vào vào lava(loại di chuyển)
/*
    + input: trạng thái(state)
*/
Lava.prototype.collide = function(state) {
    return new State(state.level, state.actors, "lost");   // trả về 1 trạng thái mới với status = "lost"
}

Wall.prototype.collide = function(state) {
    return new State(state.level, state.actors, "playing");   // trả về 1 trạng thái mới với status = "lost"
}

// chạm vào coin
/*
    + input: trạng thái(state)
*/
Coin.prototype.collide = function(state) {
    let filtered = state.actors.filter(a => a != this);    // duyệt trong các actors của state xem có cái coin đang chạm vào ko, trả về mảng những phần tử còn lại
    let status = state.status;                                // status ko thay đổi
    if(!filtered.some(a => a.type == "coin")) status = "won";  // nếu trong mảng các phần tử còn lại ko còn phần tử loại coin (tức đã chạm đc hết các coin), status = "won"
    return new State(state.level, filtered, status);          // return trạng thái mới đã kiểm tra coin
}
/*
    + array.filter(); trả về 1 mảng mới gồm các phần tử thỏa mãn điều kiện
*/

// xử lý di chuyển cho lava(loại di chuyển)
/*
    + input: time(thời gian request), trạng thái(state)
*/
Lava.prototype.update = function(time, state) {
    let newPos = this.pos.plus(this.speed.times(time));           // xác định vị trí mới bằng (pos + (this.speed * time))
    if (!state.level.touches(newPos, this.size, "wall")) {        // nếu không chạm tường
      return new Lava(newPos, this.speed, this.reset);            // trả về 1 Lava mới có( pos = newPos, speed ko đổi, this.reset)
    } else if (this.reset) {                                      // nếu chạm tường và có reset != null
      return new Lava(this.reset, this.speed, this.reset);        // trả về 1 new Lava (pos = this.reset, speed ko đổi, this.reset)    // lava nhỏ giọt
    } else {                                                      // chạm tường || reset == null
      return new Lava(this.pos, this.speed.times(-1));            // cho đi lùi lại              // lava di chuyển
    }
};

Wall.prototype.update = function(time, state) {
    let newPos = this.pos.plus(this.speed.times(time));           
    if (!state.level.touches(newPos, this.size, "lava") && 
        !state.level.touches(newPos, this.size, "wall")) {        // nếu không chạm tường
      return new Wall(newPos, this.speed, this.reset);            // trả về 1 Wall mới có( pos = newPos, speed ko đổi, this.reset)
    } else {                                                      // chạm tường || reset == null
      return new Wall(this.pos, this.speed.times(-1));            // cho đi lùi lại              // Wall di chuyển
    }
};


// xử lý coin "lung lay"
const wobbleSpeed = 8;       // tốc độ di chuyển
const wobbleDist = 0.07;     // wobble distance, khoảng cách di chuyển
/*
  + input: (time)(thời gian request)
*/
Coin.prototype.update = function(time) {
    let wobble = this.wobble + time * wobbleSpeed;                                   // hệ số lung lay
    let wobblePos = Math.sin(wobble) * wobbleDist;                                   // vị trí tới
    return new Coin(this.basePos.plus(new Vec(0, wobblePos)), this.basePos, wobble); // trả về 1 coin đã xử lý vị trí
}
/*
    + math.sin(): trả về 1 số hàm sin (-1 -> 1), nhận vào 1 số đơn vị radian
*/

// xử lý di chuyển của player
const playerXSpeed = 7;      // tốc độ di chuyển ngang
const gravity = 30;          // tốc độ rơi (trọng lực)
const jumpSpeed = 17;        // độ bật cao
/*
    + input: time(thời gian request), trạng thái(state), keys(thao tác phím)
*/
Player.prototype.update = function(time, state, keys) {
    let xSpeed = 0;                              // tọa độ ngang 
    if(keys.ArrowLeft) xSpeed -= playerXSpeed;   // nếu keys là trái, lấy xSpeed hiện tại trừ đi tốc độ di chuyển ngang
    if(keys.ArrowRight) xSpeed += playerXSpeed;  // nếu keys là phải, lấy xSpeed hiện tại cộng đi tốc độ di chuyển ngang
    let pos = this.pos;                           // vị trí
    let movedX = pos.plus(new Vec(xSpeed * time, 0));    // tạo tọa độ di chuyển ngang mới
    let player = state.player;
    let wall = state.wall;
    if(!state.level.touches(movedX, this.size, "wall")) {     // nếu ko va chạm với tường
        pos = movedX;                                         // cập nhật vi trí ngang mới
    }

    let ySpeed = this.speed.y + time * gravity;                // tọa độ dọc = khi đang rơi
    let movedY = pos.plus(new Vec(0, ySpeed * time));          // tạo tọa độ rơi
    if(!state.level.touches(movedY, this.size, "wall")) {      // nếu ko chạm tường
        pos = movedY;                                          // cập nhật tọa độ dọc mới
    } else if(keys.ArrowUp && ySpeed > 0) {                    // nếu đang có phím top và ySpeed đang ko nhảy
        ySpeed = -jumpSpeed;                                   // thực hiện nhảy bằng cách trừ âm cho jumpSpeed
    } else {                                                   // trường hợp còn lại
        ySpeed = 0;                                            // ySpeed = 0
    }

    return new Player(pos, new Vec(xSpeed, ySpeed));           // trả về new Player đã cập nhật vị trí
}

// hàm theo dõi sự kiện phím (bấm down/ ko bấm up )
/*
    + input: mảng các Arrowkeys
*/
function trackKeys(keys) {
    let down = Object.create(null);         // tạo 1 obj down trống
    function track(event) {                 // hàm nhận sự kiện 
      if (keys.includes(event.key)) {       // kiểm tra xem trong keys có sự kiện nút nào đc ấn ko , nếu có thì thực hiện
        down[event.key] = event.type == "keydown";   // nếu đang xảy ra event 1 nút đc ấn xuống (keydown), gán giá trị down[event.key] là true
        event.preventDefault();                   // ngăn sự kiện mặc định xảy ra (cuộn trang)
      }
    }
    window.addEventListener("keydown", track);      // lắng nghe sự kiện trên cửa số trình duyệt
    window.addEventListener("keyup", track);        //
    

    // down.unregister = () => {
    //     window.removeEventListener("keydown", track);
    //     window.removeEventListener("keyup", track);
    //   };

    return down;
  }
  /*
    arr.includes(): boolean; kiểm tra xem phần tử có tồn tại trong mảng ko (khác với 
        some() là gọi callback kiểm tra xem có phần tử nào thõa mãn 1 điều kiện nào đó)
    + event.preventDefault(); ngăn sự kiện mặc định xảy ra
    + BOM (Browser Object Model) là đối tượng liên quan đến trình duyệt (với mỗi trình duyệt sẽ có 
        những đối tượng khác nhau, do đó ko có quy chuẩn chung)
        DOM cũng là 1 BOM (BOM window)
    + window: đối tượng tác động đến cửa sổ trình duyệt
    + event.type: bắt sự kiện nhấp, nhả nút hoặc chuột

*/



const arrowKeys = trackKeys(["ArrowLeft", "ArrowRight", "ArrowUp"]);  // mảng các arrowKey

// hàm thực hiện animation
/*
    + input: hàm frameFunc(time(hệ số di chuyển): boolean)
*/
function runAnimation(frameFunc) {
    let lastTime = null;                          // mốc thời gian cũ
    // if(keys.Escape) {
        //     ++point;
        // }
        // if(point) {
            // console.log("duong");
        
    function frame(time) {                        // hàm để gọi callback của requestAnimationFrame: input time (thời gian request) 
        if (lastTime != null) {                   // nếu ko có mốc thời gian cũ
            let timeStep = Math.min(time - lastTime, 100) / 1000;    // thời gian request (tối đa 100ms)
            if (frameFunc(timeStep) === false) return;               // trả về trống tại các trường hợp(pausing, won hoặc lost(sau thời gian delay ending(1s)))
        }
        lastTime = time;                                             // nếu trò chơi vẫn đang tiếp tục, gán mốc thời gian cũ
        requestAnimationFrame(frame);                                // gọi requestAnimationFrame(frame), do requestAnimationFrame ko tự lặp lại nên muốn nó lặp lại thì phải gọi trong callback
    }
    // }
    requestAnimationFrame(frame);                                   // Lưu ý: requestAnimationFrame là 1 phương thức bất đồng bộ
}
/*
    + requestAnimationFrame(); hàm yêu cầu trình duyệt thực hiện một chức năng cụ thể 
        nào đó để cập nhật state trước khi repaint
    + math.min(); trả về số nhỏ nhất trong những số đc truyền vào
*/

// hàm xử lý hiện thị level
/*
    + input: level(map), Display(DOMDisplay)
*/
/*
function runLevel(level, Display) {
    let display = new Display(document.body, level);       // tạo khối hiển thị (tag body, level)
    let state = State.start(level);                        // tạo trạng thái bắt đầu (level, level.actors, "playing")
    let ending = 1;                                        // kết thúc màn hoặc kết thúc trò chơi               
    
    return new Promise(resolve => {                        // return về 1 Promise có resolve gọi hàm runAnimation
        let point = 0;
        window.addEventListener("keydown", function (event) {
            let x = event.key;
            if(x == "Escape");
        });
        runAnimation((time) => {
                                      
            state = state.update(time, arrowKeys);          // cập nhật các trạng thái
            display.syncState(state);                       // cập nhật trạng thái hiển thị
            display.textInfo(level, state); 
            if (state.status == "playing") {                // nếu đang ở status="playing"
                return true;                                // trả về true
            } else if (ending > 0) {                        // nếu kết thúc màn chơi
                ending -= time;                             // ending = ending - time
                return true;                                // trả về true
            } else {                                        // nếu "lost"
                display.clear();                            // xóa màn hình
                resolve(state.status);                      // resolve(trạng thái status)
                return false;                               // trả về false
            }
        });
    });
}
*/

// hàm chạy hiển thị level
/*
    + input: level(map), Display(DOMDisplay)
*/
function runLevel(level, Display) {
    let display = new Display(document.body, level);     // tạo khối hiển thị, (<body><div class="game">xử lý background level</div></body>)
    let state = State.start(level);                      // tạo trạng thái bắt đầu(level, level.actors, "playing")
    let ending = 1;                                      // thời gian delay khi kết thúc màn chơi (won, lost)
    let running = "yes";                                 // biến check trạng thái hiển thị "yes": chạy bình thường
                                                         //                                "no" : đã dừng, animation ko chạy
                                                         //                                "pausing": dừng, animation vẫn chạy
  
    return new Promise(resolve => {                                                     // trả về 1 Promise với hàm resolve
        function escHandler(event) {                                                    // hàm check sự kiện phím "Escape"
            if (event.key != "Escape") return;                                          // nếu phím bấm ko phải nút "Esc", thoát 
            event.preventDefault();                                                     // nếu đúng là phím "Esc", ngăn sự kiện mặc định
            if (running == "no") {                                                      // nếu đang "no"
                running = "yes";                                                        // -> "yes"
                runAnimation(frame);                                                    // chạy lại animation
            } else if (running == "yes") {                                              // nếu đang ở "yes"
                running = "pausing";                                                    // -> "pausing"
            } else {                                                                    // nếu đang ở "pausing" 
                running = "yes";                                                        // -> "yes"
            }
        }
        window.addEventListener("keydown", escHandler);                                 // bắt sự kiện nhấn phím Esc
     
        function frame(time) {                                                          // hàm frame (là tham số truyền vào runAnimation): input (thời gian request)
            if (running == "pausing") {                                                 // nếu đang ở trạng thái pausing
                running = "no";                                                         // -> no
                return false;                                                           // trả về false
            }   
                                                                                        // nếu ko phải trạng thái pausing
            state = state.update(time, arrowKeys);                                      // cập nhật trạng thái 
            display.syncState(state);                                                   // cập nhật hiển thị
            display.textInfo(level, state);                                             // cập nhật hiển thị chữ
            if (state.status == "playing") {                                            // nếu trạng thái actor là "playing" 
                return true;                                                            // trả về func frame là true
            } else if (ending > 0) {                                                    // nếu kết thúc màn mà chưa hết thời gian ending
                ending -= time;                                                         // trừ dần thời gian ending
                return true;                                                            // trả về func frame là true
            } else {                                                                    // khi đã kết thúc màn chơi và hết thời gian ending
                display.clear();                                                        // xóa hiển thị
                window.removeEventListener("keydown", escHandler);                      // đọc sự kiện esc
                resolve(state.status);                                                  // Promise luôn resolve(trạng thái hiện tại (lost or won))
                return false;                                                           // trả về func frame là false
            }
        }
        runAnimation(frame);                                                            
    });
}

/*
    + Promise (es6) để xử lý bất đồng bộ
    + resolve() là hàm thực hiện khi xử lý logic thành công
*/

// hàm chạy game
/*
    + input: plans(mảng các level), Display(giao diện)
*/
async function runGame(plans, Display) {                                                 // là 1 hàm async
    var lives = 3;                                                                       // số mạng chơi (lives)
    document.getElementById("help").innerHTML = `move with arrow keys<br> "esc" to pause<br> "f5" to play again`;
    for (var level = 0; level < 1 && lives >= 0;) {                           // vòng lặp game
        document.getElementById("rankLevel").innerHTML = `Level: ${level + 1}`;          // hiển thị text
        document.getElementById("live").innerHTML = `: ${lives}`;                        // hiển thị text
        let status = await runLevel(new Level(plans[level]),Display);                    // biến trạng thái (won or lost) nhận từ Promise của  runLevel (await: đợi đến khi nào Promise trả về trạng thái mới chạy tiếp)
        if (status == "won") {
            level++;
        } else {                                                                         // status == "lost"
            --lives;
        }
    }
    if(lives >= 0) {                                                                     // khi kết thúc plans (nếu vẫn còn lives)
        document.getElementById("result").innerHTML = `You've won!`;
        document.getElementById("secret").innerHTML = `press "y" to play special level, or other keys to exit!`;                     
    } else {                                                                             // nếu lives về âm
        document.getElementById("result").innerHTML = `Game over!`;                      // thất bại
    }

    window.addEventListener("keydown", async (event) => {
        if(event.key == "y" || event.key == "Y") {
            lives = 5;
            for (;lives >= 0;) {                           
                document.getElementById("rankLevel").innerHTML = `Level: xxx`;          // hiển thị text
                document.getElementById("live").innerHTML = `: ${lives}`;                        // hiển thị text
                let status = await runLevel(new Level(plans[1]),Display);                    // biến trạng thái (won or lost) nhận từ Promise của  runLevel (await: đợi đến khi nào Promise trả về trạng thái mới chạy tiếp)
                if (status == "won") {
                    break;
                } else {                                                                         // status == "lost"
                    --lives;
                }
            }
            if(lives >= 0) {                                                                     // khi kết thúc plans (nếu vẫn còn lives)
                document.getElementById("result").innerHTML = `You've master!`;                     // chiến thắng
            } else {                                                                             // nếu lives về âm
                document.getElementById("result").innerHTML = `You've good!`;                      // thất bại
            }       
        } else {
            return;
        }
    });
}
/*
    + async/await (es8) là cơ chế giải quyết bất đông bộ

    Async được dùng để khai báo một hàm bất đồng bộ. Các hàm bất đồng bộ sẽ luôn trả về một giá trị. 
    Việc sử dụng async chỉ đơn giản là ngụ ý rằng một lời hứa(promise) sẽ được trả lại và nếu một lời hứa không được trả lại,
     JavaScript sẽ tự động kết thúc nó.

    Await được sử dụng để chờ một Promise. Nó chỉ có thể được sử dụng bên trong một khối Async. 
    Từ khóa Await làm cho JavaScript đợi cho đến khi promise trả về kết quả.
    Cần lưu ý rằng nó chỉ làm cho khối chức năng không đồng bộ chờ đợi chứ không phải toàn bộ chương trình thực thi.
*/