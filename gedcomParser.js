var fs = require("fs");
var data = [];
var text = fs.readFileSync("./gedcomTestData.ged", "utf-8");
data = text.match(/[^\r\n]+/g);

// //Assignmet 2
// const tags = {
//   0: ["INDI", "FAM", "HEAD", "TRLR", "NOTE"],
//   1: [
//     "NAME",
//     "SEX",
//     "BIRT",
//     "DEAT",
//     "FAMC",
//     "FAMS",
//     "MARR",
//     "HUSB",
//     "WIFE",
//     "CHIL",
//     "DIV",
//   ],
//   2: ["DATE"],
// };

// var finalData = [];

// for (let line = 0; line < data.length; line++) {
//   console.log(`--> ${data[line]}`);
//   var lineData = data[line].split(" ");

//   let level = lineData[0];
//   let tag = "";
//   if (lineData[2] === "INDI" || lineData[2] === "FAM") {
//     tag = lineData[2];
//   } else {
//     tag = lineData[1];
//   }

//   var valid = tags[level].includes(tag) ? "Y" : "N";

//   if (lineData[2] === "INDI" || lineData[2] === "FAM") {
//     if (lineData[3] === "Y" || lineData[3] === "N") {
//       lineData[3] = valid;
//     } else {
//       lineData.splice(3, 0, valid);

//       var temp = lineData[1];
//       lineData.splice(1, 1);
//       lineData.splice(3, 0, temp);
//     }
//   } else {
//     if (lineData[2] === "Y" || lineData[2] === "N") {
//       lineData[2] = valid;
//     } else {
//       lineData.splice(2, 0, valid);
//     }
//   }

//   for (let count = 0; count <= lineData.length; count++) {
//     if (count === 2) {
//       if (lineData.length === 3) {
//         finalData.push(lineData[count]);
//         break;
//       }
//       finalData.push(lineData[count]);
//       arguments = lineData.slice(3, lineData.length).join(" ");
//       finalData.push(arguments);

//       break;
//     } else {
//       finalData.push(lineData[count]);
//     }
//   }

//   console.log(`<-- ${finalData.join("|")}`);
//   finalData = [];
// }

var individualData = [];

var individualDetails = {
  ID: "",
  Name: "",
  Gender: "",
  Birthday: "",
  Age: 0,
  Alive: true,
  Death: "NA",
  Child: "NA",
  Spouse: "NA",
};

for (let line = 0; line < data.length; line++) {
  var lineData = data[line].split(" ");

  if (lineData[2] === "INDI") {
    individualDetails.ID = lineData[1].replace(/[@]/g, "");

    for (let counter = line + 1; counter < data.length; counter++) {
      var nameLineData = data[counter].split(" ");

      if (nameLineData[1] === "NAME") {
        individualDetails.Name = nameLineData
          .slice(2, nameLineData.length)
          .join(" ");
      } else if (nameLineData[1] === "SEX") {
        individualDetails.Gender = nameLineData[2];
      } else if (nameLineData[1] === "BIRT") {
        individualDetails.Birthday = data[counter + 1]
          .split(" ")
          .slice(2, data[counter + 1].length)
          .join(" ");
      } else if (nameLineData[1] === "DEAT") {
        individualDetails.Alive = false;
        individualDetails.Death = data[counter + 1]
          .split(" ")
          .slice(2, data[counter + 1].length)
          .join(" ");
      } else if (nameLineData[1] === "FAMC") {
        individualDetails.Child = nameLineData[2].replace(/[@]/g, "");
      } else if (nameLineData[1] === "FAMS") {
        individualDetails.Spouse = nameLineData[2].replace(/[@]/g, "");
      } else if (nameLineData[2] === "INDI") {
        break;
      }
    }

    var birth = new Date(Date.parse(individualDetails.Birthday));
    if (individualDetails.Alive === true) {
      var today = new Date();
    } else {
      var today = new Date(Date.parse(individualDetails.Death));
    }
    var ageTime = today.getTime() - birth.getTime();
    var ageYears = Math.floor(ageTime / (1000 * 60 * 60 * 24) / 365);

    individualDetails.Age = ageYears;

    individualData.push(individualDetails);
    var individualDetails = {
      ID: "",
      Name: "",
      Gender: "",
      Birthday: "",
      Age: 0,
      Alive: true,
      Death: "NA",
      Child: "NA",
      Spouse: "NA",
    };
  }
}

console.table(individualData);
