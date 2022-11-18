var port,
  textEncoder,
  writableStreamClosed,
  writer,
  historyIndex = -1;
var beforeSecond = 0;
var start = false;
var reps = 0;
const lineHistory = [];
var dataLeftFull = [];
var dataRightFull = [];
var dataRepsLeft = [];
var dataRepsRight = [];

document.getElementById("rep").innerHTML = reps;
document.querySelector("#repb").disabled = true;

if (localStorage.auth == "false" || localStorage.auth == null) {
  window.location.replace("register.html");
}

$("#baud").val(localStorage.baud == undefined ? 9600 : localStorage.baud);
$("[name='nameUser']").html(localStorage.name);
$("[name='ageUser']").html(localStorage.age + " tahun");
$("[name='heightUser']").html(localStorage.height + " cm");
$("[name='weightUser']").html(Number(localStorage.weight).toFixed(2) + " N");
$("[name='betis']").html(localStorage.betis + " m");
$("[name='genderUser']").html(localStorage.gender);
$("[name='jenis-gerakan']").html(localStorage.jenisGerakan);

let betis = localStorage.betis;
let tinggiTrace = 100;
// PLOT DATA LINE
var layoutLine = {
  title: "Live Track",
  xaxis: {
    showgrid: false,
    zeroline: false,
    rangemode: "nonnegative",
    showticklabels: false,
  },
  yaxis: {
    title: "Unit (N)",
    range: [0, 100],
    rangemode: "nonnegative",
    // range: [0, 50],
  },
  margin: {
    l: 50,
    r: 50,
    b: 50,
    t: 50,
    pad: 4,
  },
  showlegend: false,
};

var layoutLeft = {
  title: "Left",
  xaxis: {
    showticklabels: false,
  },
  yaxis: {
    showgrid: true,
    range: [0, 500],
    textinfo: "none",
    zeroline: false,
    showticklabels: false,
  },
  margin: {
    l: 50,
    r: 50,
    b: 50,
    t: 50,
    pad: 4,
  },
};

var layoutRight = {
  title: "Right",
  xaxis: {
    showticklabels: false,
  },
  yaxis: {
    showgrid: true,
    range: [0, 500],
    textinfo: "none",
    zeroline: false,
    showticklabels: false,
  },
  margin: {
    l: 50,
    r: 50,
    b: 50,
    t: 50,
    pad: 4,
  },
};

var trace1 = {
  y: [0],
  mode: "lines",
  name: "Left",
  marker: {
    color: "darkRed",
  },
};

var trace2 = {
  y: [0],
  mode: "lines",
  name: "Right",
  marker: {
    color: "darkGreen",
  },
};

var traceLeft = {
  y: [0],
  type: "bar",
  name: "Left",
  marker: {
    color: "darkRed",
  },
};

var traceRight = {
  y: [0],
  type: "bar",
  name: "Right",
  marker: {
    color: "darkGreen",
  },
};

var data = [trace1, trace2];
var dataLeft = [traceLeft];
var dataRight = [traceRight];

Plotly.newPlot("chart", data, layoutLine, {
  staticPlot: true,
  responsive: true,
});
Plotly.newPlot("plot-left", dataLeft, layoutLeft, {
  staticPlot: true,
  responsive: true,
});
Plotly.newPlot("plot-right", dataRight, layoutRight, {
  staticPlot: true,
  responsive: true,
});

async function connectSerial() {
  try {
    // Prompt user to select any serial port.
    port = await navigator.serial.requestPort();

    await port.open({ baudRate: document.getElementById("baud").value });
    let settings = {};

    if (localStorage.dtrOn == "true") settings.dataTerminalReady = true;
    if (localStorage.rtsOn == "true") settings.requestToSend = true;
    if (Object.keys(settings).length > 0) await port.setSignals(settings);

    textEncoder = new TextEncoderStream();
    writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    writer = textEncoder.writable.getWriter();

    $("#messagePort").html('<div class="alert alert-success ms-2" role="alert" style="margin: 0; padding: 7px 5px 7px 5px;">Connected</div>');

    await listenToPort();
  } catch (e) {
    alert("Serial Connection Failed" + e);
  }
}

if (start) {
  connection.on("event-from-arduino", function (data) {
    console.log(data);
  });
}

async function listenToPort() {
  const textDecoder = new TextDecoderStream();

  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  // Listen to data coming from the serial device.
  let data,
    l = 0,
    r = 0;
  let startHitung = false;
  while (true) {
    let datafinal;

    const { value, done } = await reader.read();
    if (done) {
      // Allow the serial port to be closed later.
      console.log("[readLoop] DONE", done);
      reader.releaseLock();
      break;
    }
    // value is a string.
    // console.log("from arduino : " + value);
    if (value[0] == "*") {
      startHitung = true;
      data = "";
    }
    if (startHitung) {
      data += value;
      // console.log(data[data.length - 1]);
      if (data[data.length - 1] == "e") {
        datafinal = data;
        if (datafinal[1] == "L") {
          l = datafinal.slice(2, datafinal.length - 1);
        } else {
          r = datafinal.slice(2, datafinal.length - 1);
        }
        // console.log("hasil l : " + l);
        // console.log("hasil r : " + r);
        startHitung = false;
      }
    }

    if (value[1] == "L") left = value.slice(1);
    if (value[1] == "R") right = value.slice(1);
    if (start) {
      Plotly.extendTraces(
        "chart",
        {
          y: [[l], [r]],
        },
        [0, 1]
      );

      Plotly.update(
        "plot-left",
        {
          y: [[l]],
        },
        {},
        [0]
      );

      Plotly.update(
        "plot-right",
        {
          y: [[r]],
        },
        {},
        [0]
      );

      insert(l, r);
    }
  }
}

async function startt() {
  start = true;
  await writer.write("s");
  reps = 1;

  document.getElementById("rep").innerHTML = reps;
  document.querySelector("#repb").disabled = false;
  beforeSecond = Math.round(+new Date() / 1000);
}

async function stopp() {
  dataRepsLeft.push(dataLeftFull);
  dataRepsRight.push(dataRightFull);
  await writer.write("f");
  var table = document.getElementById("logData");
  table.insertRow().insertCell(0);
  var header = table.insertRow();
  header.insertCell(0).innerHTML = "<b>Repetisi</b>";
  header.insertCell(1).innerHTML = "<b>Max Kiri (N)</b>";
  header.insertCell(2).innerHTML = "<b>Max Kanan (N)</b>";
  header.insertCell(3).innerHTML = "<b>Max Torsi Kiri (N.m)</b>";
  header.insertCell(4).innerHTML = "<b>Max Torsi Kanan (N.m)</b>";
  header.insertCell(5).innerHTML = "<b>Asimetri (N)</b>";
  header.insertCell(6).innerHTML = "<b>Persentase (%)</b>";
  header.insertCell(7).innerHTML = "<b>Kaki Paling Kuat</b>";
  header.insertCell(8).innerHTML = "<b>Resiko Cidera</b>";

  for (let i = 0; i < reps; i++) {
    let leftmax = Math.max(...dataRepsLeft[i]);
    let rightmax = Math.max(...dataRepsRight[i]);
    var row = table.insertRow();
    row.insertCell(0).innerHTML = "Repetisi" + (i + 1);
    row.insertCell(1).innerHTML = Number(leftmax).toFixed(2);
    row.insertCell(2).innerHTML = Number(rightmax).toFixed(2);
    row.insertCell(3).innerHTML = (leftmax * Number(betis)).toFixed(2);
    row.insertCell(4).innerHTML = (rightmax * Number(betis)).toFixed(2);
    row.insertCell(5).innerHTML = Math.abs(rightmax - leftmax).toFixed(2);
    row.insertCell(6).innerHTML = ((Math.abs(rightmax - leftmax) / Math.max(rightmax, leftmax)) * 100).toFixed(3) + "%";
    row.insertCell(7).innerHTML = rightmax > leftmax ? "Kanan" : rightmax == leftmax ? "Setara" : "Kiri";

    row.insertCell(8).innerHTML = (Math.abs(rightmax - leftmax) / Math.max(rightmax, leftmax)) * 100 < 15 ? "Tidak beresiko" : "Beresiko";
  }
  document.getElementById("rep").innerHTML = reps;
  document.querySelector("#repb").disabled = true;
  start = false;
  console.log(dataRepsLeft);
  console.log(dataRepsRight);
}

function repss() {
  reps++;
  dataRepsLeft.push(dataLeftFull);
  dataRepsRight.push(dataRightFull);
  dataLeftFull = [];
  dataRightFull = [];
  document.getElementById("rep").innerHTML = reps;
}

var size = 1;
var sizeBefore = 1;
function insert(left, right) {
  if (isNaN(left)) left = 0;
  if (isNaN(right)) right = 0;

  if (left > 900 || right > 900) {
    size = 10;
    if (size > sizeBefore) {
      sizeBefore = 10;
    }
  } else if (left > 800 || right > 800) {
    size = 9;
    if (size > sizeBefore) {
      sizeBefore = 9;
    }
  } else if (left > 700 || right > 700) {
    size = 8;
    if (size > sizeBefore) {
      sizeBefore = 8;
    }
  } else if (left > 600 || right > 600) {
    size = 7;
    if (size > sizeBefore) {
      sizeBefore = 7;
    }
  } else if (left > 500 || right > 500) {
    size = 6;
    if (size > sizeBefore) {
      sizeBefore = 6;
    }
  } else if (left > 400 || right > 400) {
    size = 5;
    if (size > sizeBefore) {
      sizeBefore = 5;
    }
  } else if (left > 300 || right > 300) {
    size = 4;
    if (size > sizeBefore) {
      sizeBefore = 4;
    }
  } else if (left > 200 || right > 200) {
    size = 3;
    if (size > sizeBefore) {
      sizeBefore = 3;
    }
  } else if (left > 100 || right > 100) {
    size = 2;
    if (size > sizeBefore) {
      sizeBefore = 2;
    }
  }

  let newLayout = {
    title: "Live Track",
    xaxis: {
      showgrid: false,
      zeroline: false,
      rangemode: "nonnegative",
      showticklabels: false,
    },
    yaxis: {
      title: "Unit (N)",
      range: [0, 100 * sizeBefore],
      rangemode: "nonnegative",
      // range: [0, 50],
    },
    margin: {
      l: 50,
      r: 50,
      b: 50,
      t: 50,
      pad: 4,
    },
    showlegend: false,
  };

  Plotly.relayout("chart", newLayout);

  dataLeftFull.push(left);
  dataRightFull.push(right);
  var sec = Math.round(+new Date() / 1000) - beforeSecond;
  var table = document.getElementById("logData");
  var row = table.insertRow();
  row.hidden = true;
  row.insertCell(0).innerHTML = sec + " sec";
  row.insertCell(1).innerHTML = "Repetisi" + reps;
  row.insertCell(2).innerHTML = Number(left).toFixed(2);
  row.insertCell(3).innerHTML = Number(right).toFixed(2);
  row.insertCell(4).innerHTML = Number(left * betis).toFixed(2);
  row.insertCell(5).innerHTML = Number(right * betis).toFixed(2);
  row.insertCell(6).innerHTML = Math.abs(Number(left) - Number(right)).toFixed(2);
}

function exportTableToExcel(tableID) {
  var table2excel = new Table2Excel();
  table2excel.export(document.querySelectorAll("#" + tableID));
}

function exportpdf() {
  // window.html2pdf = html2pdf;
  var element = document.getElementById("utama");
  var opt = {
    margin: 2,
    filename: "file.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 2, width: 1150 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  html2pdf().set(opt).from(element).save();
}
