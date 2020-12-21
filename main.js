// onload print Base Object/JSONPatch into <pre> tag and Build New Object name "dynamicData"
window.addEventListener("load", function () {
  document.getElementById("leftCode").innerHTML = JSON.stringify(data, null, 3);
  document.getElementById("rightCode").innerHTML = JSON.stringify(JSONPatch,null,3);
  buildNewObject(JSON.parse(document.getElementById("rightCode").innerHTML));
});

const buildNewObject = (e) => {
  e.forEach(function (x) {
    const pathname = x["path"].split("/").join(".").substring(1);
    pushEachObject(dynamicData, pathname, x["value"]);
  });
  document.getElementById("rightCode").innerHTML = JSON.stringify(e, null, 3);
};

// update DynamicData on bases of Each Action in JSONPatch
const pushEachObject = (obj, path, value) => {
  var pList = path.split(".");
  var len = pList.length;
  for (var i = 0; i < len - 1; i++) {
    var elem = pList[i];
    if (!obj[elem]) obj[elem] = {};
    obj = obj[elem];
  }
  obj[pList[len - 1]] = value;
};

// this will differencial the Base Object vs Dynamic Object and return the data on #output
const handleDiff = (e) => {
  var output = jsondiffpatch.diff(e, dynamicData);
  // if(output)
  let outputHTML = jsondiffpatch.formatters.html.format(output, dynamicData);
  if (outputHTML === "") {
    outputHTML = "<h2>Changes Successfully Merged</h2>";
    document.getElementById("viewChange").style.display == "none";
  }
  document.getElementById("output").innerHTML = outputHTML;
  triggerMouseEvents();
};

// variable for Mouseover/Mouseout
var showPopup = false;
var position = { x: 0, y: 0 };
var currentTarget;
var popupXOffset;
var popupYOffset;

// trigger after diff of New Data and Base Data have been Loaded
// so that mouseover/mouseout effect applies to all li elements
const triggerMouseEvents = () => {
  const element = document.querySelectorAll(
    "li.jsondiffpatch-modified, li.jsondiffpatch-added"
  );
  element.forEach((x) => {
    x.addEventListener("mouseover", () => {
      onMouseOver(x);
    });

    document.addEventListener("mousemove", (e) => {
      if (
        e.target.classList?.contains("hide") ||
        e.target.classList?.contains("jsondiffpatch-unchanged")
      ) {
        onMouseOut(x);
      } else {
      }
    });
  });

  const element2 = document.querySelectorAll(".jsondiffpatch-unchanged");
  element2.forEach((y) => {
    y.addEventListener("mouseover", () => {
      onMouseOut(y);
    });
  });
};

// each LI mouseover function
const onMouseOver = (e) => {
  document.getElementById("popup").classList.remove("hide");
  document.querySelector(".active")?.classList.remove("active");
  e.classList.add("active");
  document.getElementById("popup").style.height = e.clientHeight + "px";
  document
    .querySelector("#popup button#accept")
    .setAttribute("data-target", "");
  document
    .querySelector("#popup button#reject")
    .setAttribute("data-target", "");

  let li = e;
  if (!li) return;

  if (e && isModified(e)) {
    position.x = e.offsetLeft;
    position.y = e.offsetTop;
    currentTarget = e.target;
    document.getElementById("popup").classList.remove("hide");
    e.classList.add("active");
    document.getElementById("popup").style.position = "absolute";
    document.getElementById("popup").style.top = e.offsetTop + "px";
    document.getElementById("popup").style.left =
      e.offsetLeft + e.clientWidth + "px";
    document
      .querySelector("#popup button#accept")
      .setAttribute("data-target", e);
    document
      .querySelector("#popup button#reject")
      .setAttribute("data-target", e);
  }
};

// each LI mouseout function
const onMouseOut = (e) => {
  document.getElementById("popup").classList.add("hide");
  document.querySelector(".active")?.classList.remove("active");
  document
    .querySelector("#popup button#accept")
    .setAttribute("data-target", "");
  document
    .querySelector("#popup button#reject")
    .setAttribute("data-target", "");
};

// this will trigger went user clicks on Accept / Reject Button
const RunJSONPatch = (mode) => {
  let op;
  let elemnt = document.querySelector(".active");
  let classNm = document
    .querySelector(".active")
    .className.replace("active", "")
    .trim();
  const pathname = makePath(elemnt, classNm);

  // set current objectline's action's operation name
  switch (classNm) {
    case "jsondiffpatch-modified":
      op = "replace";
      break;
    case "jsondiffpatch-added":
      op = "add";
      break;
    case "jsondiffpatch-deleted":
      op = "remove";
      break;
  }

  //get current objectline's action's Object from JSONPatch
  var patchObj = getPatchObject(op, pathname);
  if (patchObj) {
    const patchPath = patchObj["path"].split("/").join(".").substring(1);

    if (mode == "accept") {
      // will push JSONPatch into Base Object
      setObjVal(data, patchPath, patchObj.value);
      Object.values(data).map((item, index) => {
        if (Array.isArray(item)) {
          data[Object.keys(data)[index]] = data[
            Object.keys(data)[index]
          ].filter((item) => item);
        }
      });
      document.getElementById("leftCode").innerHTML = JSON.stringify(
        data,
        null,
        3
      );
      handleDiff(data);
    } else if (mode == "reject") {
      // delete action's Object from JSONPatch Array
      deleteFromPatch(op, pathname);

      // Updating Dynamic Data according to New JSON Patch Array
      var oldObj = data;
      var obj = dynamicData;
      var pList = patchPath.split(".");
      var len = pList.length;
      for (var i = 0; i < len - 1; i++) {
        var elem = pList[i];
        if (!obj[elem]) obj[elem] = {};
        obj = obj[elem];
        oldObj = oldObj[elem];
      }

      if (op == "replace") {
        obj[pList[len - 1]] = oldObj[pList[len - 1]];
      } else {
        delete obj[pList[len - 1]];
      }

      Object.values(dynamicData).map((item, index) => {
        if (Array.isArray(item)) {
          dynamicData[Object.keys(dynamicData)[index]] = dynamicData[
            Object.keys(dynamicData)[index]
          ].filter((item) => item);
        }
      });

      document.getElementById("rightCode").innerHTML = JSON.stringify(
        JSONPatch,
        null,
        3
      );
      handleDiff(data);
    }
  }
};

const setObjVal = (obj, path, value) => {
  var pList = path.split(".");
  var len = pList.length;
  for (var i = 0; i < len - 1; i++) {
    var elem = pList[i];
    if (!obj[elem]) obj[elem] = {};
    obj = obj[elem];
  }

  obj[pList[len - 1]] = value;
};

const isModified = (e) => {
  e.className = e.className.replace("active", "");
  if (e.className.includes("jsondiffpatch-modified")) {
    return true;
  } else if (e.className.includes("jsondiffpatch-added")) {
    return true;
  } else if (e.className.includes("jsondiffpatch-deleted")) {
    return true;
  } else {
    return false;
  }
};

const makePath = (elemnt, classNm) => {
  let path = "" || [];

  while (elemnt.id !== "output") {
    if (
      elemnt.childElementCount > 0 &&
      elemnt.childNodes[0].className === "jsondiffpatch-property-name"
    ) {
      path.push(elemnt.childNodes[0].textContent);
    }
    elemnt = elemnt.parentElement;
    className = classNm;
  }

  return "/" + path.reverse().join("/");
};

const getPatchObject = (op, pathname) => {
  const updatePatch = JSONPatch.filter((item) => {
    if ((item.op == op || "replace" || "add") && item.path == pathname) {
      return item;
    }
  })[0];
  return updatePatch;
};

const deleteFromPatch = (e, f) => {
  for (var i = 0; i < JSONPatch.length; i++) {
    if ((JSONPatch[i].e == e || "add") && JSONPatch[i].path == f) {
      JSONPatch.splice(i, 1);
    }
  }
};

//eventlistner functions

const accept = document.getElementById("accept");
accept.addEventListener("click", () => {
  RunJSONPatch("accept");
  document.getElementById("popup").classList.add("hide");
});

const reject = document.getElementById("reject");
reject.addEventListener("click", () => {
  RunJSONPatch("reject");
  document.getElementById("popup").classList.add("hide");
});

const handleClick = () => {
    let oldData = JSON.parse(document.getElementById("leftCode").innerHTML);
    handleDiff(oldData);
  };