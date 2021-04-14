var fs = require("fs");
var data = [];
var text = fs.readFileSync("./gedcomTestData.ged", "utf-8");
data = text.match(/[^\r\n]+/g);

console.clear();

//Function to compare two dates
function dateChecker(date1, date2 = new Date()) {
  var date1 = new Date(Date.parse(date1));
  var date2 = new Date(Date.parse(date2));
  var ageTime = date2.getTime() - date1.getTime();

  if (ageTime < 0) {
    return false; //date2 is before date1
  } else {
    return true;
  }
}

//Age Calculator Function
function calculateAge(dob, dod) {
  //dob- date of birth, dod- date of death
  let birthDay, current, millisec_difference, deathDay;

  birthDay = new Date(Date.parse(dob));
  deathDay = new Date(Date.parse(dod));
  //console.log(deathDay);

  current = new Date();

  if (!dod) {
    millisec_difference = Math.abs(current.getTime() - birthDay.getTime());
  } else {
    millisec_difference = Math.abs(deathDay.getTime() - birthDay.getTime());
  }

  let age = millisec_difference / (1000 * 3600 * 24 * 365);

  return age;
}

//Errors Array to store all error in gedcom file
var errors = [];

//Individual Table
var individualData = [];
var individualDetails = {
  ID: "",
  Name: "",
  Gender: "",
  Birthday: "",
  Age: Number,
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

        if (!dateChecker(individualDetails.Birthday)) {
          errors.push(
            `ERROR: INDIVIDUAL: US01: ${individualDetails.ID}: Birthday ${individualDetails.Birthday} occurs in the future.`
          );
        }
      } else if (nameLineData[1] === "DEAT") {
        individualDetails.Alive = false;
        individualDetails.Death = data[counter + 1]
          .split(" ")
          .slice(2, data[counter + 1].length)
          .join(" ");

        if (!dateChecker(individualDetails.Death)) {
          errors.push(
            `ERROR: INDIVIDUAL: US01: ${individualDetails.ID}: Death ${individualDetails.Death} occurs in the future.`
          );
        }
        if (!dateChecker(individualDetails.Birthday, individualDetails.Death)) {
          errors.push(
            `ERROR: INDIVIDUAL: ${individualDetails.ID}: US03: Birth ${individualDetails.Birthday} occurs after death ${individualDetails.Death}`
          );
        }
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
      Age: Number,
      Alive: true,
      Death: "NA",
      Child: "NA",
      Spouse: "NA",
    };
  }
}
console.log("People");
console.table(individualData);

//Family Table
var familyData = [];
var familyDetails = {
  ID: "",
  Married: "",
  Divorced: "NA",
  HusbandId: "",
  HusbandName: "",
  WifeId: "",
  WifeName: "",
  Children: [],
};

for (let line = 0; line < data.length; line++) {
  var lineData = data[line].split(" ");

  if (lineData[2] === "FAM") {
    familyDetails.ID = lineData[1].replace(/[@]/g, "");

    for (let counter = line + 1; counter < data.length; counter++) {
      var familyLineData = data[counter].split(" ");

      if (familyLineData[1] === "MARR") {
        familyDetails.Married = data[counter + 1]
          .split(" ")
          .slice(2, data[counter + 1].length)
          .join(" ");

        if (!dateChecker(familyDetails.Married)) {
          errors.push(
            `ERROR: INDIVIDUAL: US01: ${familyDetails.ID}: Marriage ${familyDetails.Married} occurs in the future.`
          );
        }
      } else if (familyLineData[1] === "HUSB") {
        familyDetails.HusbandId = familyLineData[2].replace(/[@]/g, "");
        for (let indiData = 0; indiData < individualData.length; indiData++) {
          if (individualData[indiData].ID === familyDetails.HusbandId) {
            husbandBirthDate = individualData[indiData].Birthday;
            break;
          }
        }
        if (!dateChecker(husbandBirthDate, familyDetails.Married)) {
          errors.push(
            `ERROR: FAMILY: ${familyDetails.ID}: US02: Husband's birth date ${husbandBirthDate} is after marriage date ${familyDetails.Married}.`
          );
        }
      } else if (familyLineData[1] === "WIFE") {
        familyDetails.WifeId = familyLineData[2].replace(/[@]/g, "");
        for (let indiData = 0; indiData < individualData.length; indiData++) {
          if (individualData[indiData].ID === familyDetails.WifeId) {
            wifeBirthDate = individualData[indiData].Birthday;
            break;
          }
        }
        if (!dateChecker(wifeBirthDate, familyDetails.Married)) {
          errors.push(
            `ERROR: FAMILY: ${familyDetails.ID}: US02: Wife's birth date ${wifeBirthDate} is after marriage date ${familyDetails.Married}.`
          );
        }
      } else if (familyLineData[1] === "CHIL") {
        familyDetails.Children.push(familyLineData[2].replace(/[@]/g, ""));
      } else if (familyLineData[1] === "DIV") {
        familyDetails.Divorced = data[counter + 1]
          .split(" ")
          .slice(2, data[counter + 1].length)
          .join(" ");

        if (!dateChecker(familyDetails.Divorced)) {
          errors.push(
            `ERROR: FAMILY: US01: ${familyDetails.ID}: US01: Divorce ${familyDetails.Divorced} occurs in the future.`
          );
        }
        if (!familyDetails.Married) {
          errors.push(
            `ERROR: FAMILY: US04: ${familyDetails.ID}: Divorce ${familyDetails.Divorced} cannot occur without marriage.`
          );
        }

        if (!dateChecker(familyDetails.Married, familyDetails.Divorced)) {
          errors.push(
            `ERROR: FAMILY: US04: ${familyDetails.ID}: Divorce ${familyDetails.Divorced} occurs before marriage in ${familyDetails.Married}.`
          );
        }
      } else if (familyLineData[2] === "FAM") {
        break;
      }
    }

    for (let indiData = 0; indiData < individualData.length; indiData++) {
      if (individualData[indiData].ID === familyDetails.HusbandId) {
        familyDetails.HusbandName = individualData[indiData].Name;
      }
      if (individualData[indiData].ID === familyDetails.WifeId) {
        familyDetails.WifeName = individualData[indiData].Name;
      }
    }

    familyData.push(familyDetails);
    var familyDetails = {
      ID: "",
      Married: "",
      Divorced: "NA",
      HusbandId: "",
      HusbandName: "",
      WifeId: "",
      WifeName: "",
      Children: [],
    };
  }
}
console.log("Families");
console.table(familyData);

//US05 -	Marriage before death	- Marriage should occur before death of either spouse
let familyDataElement, indiDataElement;
for (
  familyDataElement = 0;
  familyDataElement < familyData.length;
  familyDataElement++
) {
  marriageDate = new Date(Date.parse(familyData[familyDataElement].Married));

  for (
    indiDataElement = 0;
    indiDataElement < individualData.length;
    indiDataElement++
  ) {
    if (
      individualData[indiDataElement].ID ==
        familyData[familyDataElement].HusbandId &&
      individualData[indiDataElement].Death != "NA"
    ) {
      if (!dateChecker(marriageDate, individualData[indiDataElement].Death)) {
        errors.push(
          `ERROR: FAMILY: US05: ${familyData[familyDataElement].ID}: Married ${familyData[familyDataElement].Married} after husband's (${familyData[familyDataElement].HusbandId}) death on ${individualData[indiDataElement].Death}`
        );
      }
    }

    if (
      individualData[indiDataElement].ID ==
        familyData[familyDataElement].WifeId &&
      individualData[indiDataElement].Death != "NA"
    ) {
      if (!dateChecker(marriageDate, individualData[indiDataElement].Death)) {
        errors.push(
          `ERROR: FAMILY: US05: ${familyData[familyDataElement].ID}: Married ${familyData[familyDataElement].Married} after wife's (${familyData[familyDataElement].WifeId}) death on ${individualData[indiDataElement].Death}`
        );
      }
    }
  }
}

//US06	Divorce before death	Divorce can only occur before death of both spouses
for (
  familyDataElement = 0;
  familyDataElement < familyData.length;
  familyDataElement++
) {
  if (familyData[familyDataElement].Divorced != "NA") {
    for (
      indiDataElement = 0;
      indiDataElement < individualData.length;
      indiDataElement++
    ) {
      if (
        individualData[indiDataElement].ID ==
          familyData[familyDataElement].HusbandId &&
        individualData[indiDataElement].Death != "NA"
      ) {
        if (
          !dateChecker(
            familyData[familyDataElement].Divorced,
            individualData[indiDataElement].Death
          )
        ) {
          errors.push(
            `ERROR: FAMILY: US06: ${familyData[familyDataElement].ID}: Divorced ${familyData[familyDataElement].Divorced} after husband's (${familyData[familyDataElement].HusbandId}) death on ${individualData[indiDataElement].Death}`
          );
        }
      }
      if (
        individualData[indiDataElement].ID ==
          familyData[familyDataElement].WifeId &&
        individualData[indiDataElement].Death != "NA"
      ) {
        if (
          !dateChecker(
            familyData[familyDataElement].Divorced,
            individualData[indiDataElement].Death
          )
        ) {
          errors.push(
            `ERROR: FAMILY: US06: ${familyData[familyDataElement].ID}: Divorced ${familyData[familyDataElement].Divorced} after wife's (${familyData[familyDataElement].WifeId}) death on ${individualData[indiDataElement].Death}`
          );
        }
      }
    }
  }
}

//US07 - Less then 150 years old	- Death should be less than 150 years after birth for dead people, and current date should be less than 150 years after birth for all living people
for (
  indiDataElement = 0;
  indiDataElement < individualData.length;
  indiDataElement++
) {
  if (individualData[indiDataElement].Alive == true) {
    let age = calculateAge(individualData[indiDataElement].Birthday);

    if (age > 150) {
      errors.push(
        `ERROR: INDIVIDUAL: US07: ${individualData[indiDataElement].ID}: More than 150 years old - Birth ${individualData[indiDataElement].Birthday}`
      );
    }
  } else {
    let age = calculateAge(
      individualData[indiDataElement].Birthday,
      individualData[indiDataElement].Death
    );

    if (age > 150) {
      errors.push(
        `ERROR: INDIVIDUAL: US07: ${individualData[indiDataElement].ID}: More than 150 years old at death - Birth ${individualData[indiDataElement].Birthday} : Death ${individualData[indiDataElement].Death}`
      );
    }
  }
}

//US08	Birth before marriage of parents	Children should be born after marriage of parents (and not more than 9 months after their divorce)
for (
  familyDataElement = 0;
  familyDataElement < familyData.length;
  familyDataElement++
) {
  if (familyData[familyDataElement].Children.length != 0) {
    for (
      childrenDataElement = 0;
      childrenDataElement < familyData[familyDataElement].Children.length;
      childrenDataElement++
    ) {
      for (
        indiDataElement = 0;
        indiDataElement < individualData.length;
        indiDataElement++
      ) {
        if (
          familyData[familyDataElement].Children[childrenDataElement] ==
          individualData[indiDataElement].ID
        ) {
          if (
            dateChecker(
              individualData[indiDataElement].Birthday,
              familyData[familyDataElement].Married
            )
          ) {
            errors.push(
              `ANAMOLY: FAMILY: US08: ${familyData[familyDataElement].ID} Child ${individualData[indiDataElement].ID} born ${individualData[indiDataElement].Birthday} before marriage on ${familyData[familyDataElement].Married}`
            );
          } else if (familyData[familyDataElement].Divorced != "NA") {
            let difference = calculateAge(
              familyData[familyDataElement].Divorced,
              individualData[indiDataElement].Birthday
            );

            if (difference >= 0.75) {
              errors.push(
                `ANAMOLY: FAMILY: US08: ${familyData[familyDataElement].ID} Child ${individualData[indiDataElement].ID} born ${individualData[indiDataElement].Birthday} after divorce on ${familyData[familyDataElement].Divorced}`
              );
            }
          }
        }
      }
    }
  }
}

//US09	Birth before death of parents	Child should be born before death of mother and before 9 months after death of father
for (
  let familyDataElement = 0;
  familyDataElement < familyData.length;
  familyDataElement++
) {
  for (
    let indiDataElement = 0;
    indiDataElement < individualData.length;
    indiDataElement++
  ) {
    if (
      familyData[familyDataElement].HusbandId ==
        individualData[indiDataElement].ID &&
      !individualData[indiDataElement].Alive
    ) {
      //finding husbandid and checking further if not alive
      husbandDeathDate = new Date(
        Date.parse(individualData[indiDataElement].Death)
      );
      fatherDeathDate = individualData[indiDataElement].Death;
      for (
        let childIndex = 0;
        childIndex < familyData[familyDataElement].Children.length;
        childIndex++
      ) {
        //iterating through each element in children array

        for (
          let indiDataElement = 0;
          indiDataElement < individualData.length;
          indiDataElement++
        ) {
          if (
            individualData[indiDataElement].ID ==
            familyData[familyDataElement].Children[childIndex]
          ) {
            childBirthDay = new Date(
              Date.parse(individualData[indiDataElement].Birthday)
            );
            difference = calculateAge(childBirthDay, husbandDeathDate); //calculating difference between child birthdate and father's death date

            if (difference < 0.75) {
              //child should be born before 9 months from death of father
              errors.push(
                `ERROR: INDIVIDUAL: US09: ${individualData[indiDataElement].ID}: Born on ${individualData[indiDataElement].Birthday} after death of father (${familyData[familyDataElement].HusbandId}) on ${fatherDeathDate} `
              );
            }
          }
        }
      }
    }
    if (
      familyData[familyDataElement].WifeId ==
        individualData[indiDataElement].ID &&
      !individualData[indiDataElement].Alive
    ) {
      wifeDeathDate = new Date(
        Date.parse(individualData[indiDataElement].Death)
      );
      motherDeathDate = individualData[indiDataElement].Death;
      for (
        let childIndex = 0;
        childIndex < familyData[familyDataElement].Children.length;
        childIndex++
      ) {
        //iterating through each element in children array

        for (
          let indiDataElement = 0;
          indiDataElement < individualData.length;
          indiDataElement++
        ) {
          if (
            individualData[indiDataElement].ID ==
            familyData[familyDataElement].Children[childIndex]
          ) {
            childBirthDay = new Date(
              Date.parse(individualData[indiDataElement].Birthday)
            );

            if (!dateChecker(childBirthDay, wifeDeathDate)) {
              //if mother's death data is before child's birthdate condition is true and throws error
              errors.push(
                `ERROR: INDIVIDUAL: US09: ${individualData[indiDataElement].ID}: Born on ${individualData[indiDataElement].Birthday} after death of mother (${familyData[familyDataElement].WifeId}) on ${motherDeathDate}`
              );
            }
          }
        }
      }
    }
  }
}

//US10	-Marriage after 14	-Marriage should be at least 14 years after birth of both spouses (parents must be at least 14 years old)
for (
  let familyDataElement = 0;
  familyDataElement < familyData.length;
  familyDataElement++
) {
  let marriageDate = new Date(
    Date.parse(familyData[familyDataElement].Married)
  );
  let husbandId = familyData[familyDataElement].HusbandId;
  let wifeId = familyData[familyDataElement].WifeId;
  //console.log(marriageDate);
  for (
    let indiDataElement = 0;
    indiDataElement < individualData.length;
    indiDataElement++
  ) {
    if (individualData[indiDataElement].ID == husbandId) {
      husbandBirthday = individualData[indiDataElement].Birthday;
    }
    if (individualData[indiDataElement].ID == wifeId) {
      wifeBirthday = individualData[indiDataElement].Birthday;
    }
  }
  let diffHusband = calculateAge(marriageDate, husbandBirthday); //calculates the difference between the marriage date and husband birth date
  let diffWife = calculateAge(marriageDate, wifeBirthday); //calculates the difference between the marriage date and wife birth date

  if (diffHusband < 14) {
    errors.push(
      `ERROR: INDIVIDUAL: US10: ${husbandId}: married before the age of 14`
    );
  }
  if (diffWife < 14) {
    errors.push(
      `ERROR: INDIVIDUAL: US10: ${wifeId}: married before the age of 14`
    );
  }
}

//US11 Marriage should not occur during marriage to another spouse
for (let line = 0; line < data.length; line++) {
  var lineData = data[line].split(" ");

  if (lineData[2] === "FAM") {
    for (let counter = line + 1; counter < data.length; counter++) {
      var familyLineData = data[counter].split(" ");

      if (familyLineData[1] === "MARR") {
        marriageDate = data[counter + 1]
          .split(" ")
          .slice(2, data[counter + 1].length)
          .join(" ");

        for (
          let marriageCounter = counter + 1;
          marriageCounter < data.length;
          marriageCounter++
        ) {
          var familyLineData = data[marriageCounter].split(" ");

          if (familyLineData[1] === "MARR") {
            compareMarriageDate = data[marriageCounter + 1]
              .split(" ")
              .slice(2, data[marriageCounter + 1].length)
              .join(" ");

            if (marriageDate === compareMarriageDate) {
              var famOneIncrement;
              var famTwoIncrement;
              if (data[counter + 2].split(" ")[1] === "HUSB") {
                famOneIncrement = 2;
              } else {
                famOneIncrement = 4;
              }
              if (data[marriageCounter + 2].split(" ")[1] === "HUSB") {
                famTwoIncrement = 2;
              } else {
                famTwoIncrement = 4;
              }

              if (
                data[counter + famOneIncrement].split(" ")[2] ===
                data[marriageCounter + famTwoIncrement].split(" ")[2]
              ) {
                errors.push(
                  `ANAMOLY: FAMILY: US11: ${data[marriageCounter - 1]
                    .split(" ")[1]
                    .replace(/[@]/g, "")}: Marriage of Husband ${data[
                    marriageCounter + famTwoIncrement
                  ]
                    .split(" ")[2]
                    .replace(
                      /[@]/g,
                      ""
                    )} occurs with both the spouse on same day.`
                );
                counter = marriageCounter;
                break;
              }
              if (
                data[counter + famOneIncrement + 1].split(" ")[2] ===
                data[marriageCounter + famTwoIncrement + 1].split(" ")[2]
              ) {
                errors.push(
                  `ANAMOLY: FAMILY: US11: ${data[marriageCounter - 1]
                    .split(" ")[1]
                    .replace(/[@]/g, "")}: Marriage of Wife ${data[
                    marriageCounter + famTwoIncrement + 1
                  ]
                    .split(" ")[2]
                    .replace(
                      /[@]/g,
                      ""
                    )} occurs with both the spouse on same day.`
                );
                counter = marriageCounter;
                break;
              }
            }
          }
        }
      }
    }
  }
}

//US12 Mother should be less than 60 years older than her children and father should be less than 80 years older than his children
for (let line = 0; line < data.length; line++) {
  var lineData = data[line].split(" ");
  if (lineData[1] === "HUSB") {
    var husband = lineData[2];
    var wife = data[line + 1].split(" ")[2];
    for (let counter = line + 1; counter < data.length; counter++) {
      var familyLineData = data[counter].split(" ");
      if (familyLineData[2] === "FAM") {
        break;
      }

      for (let lineLoop = 0; lineLoop < data.length; lineLoop++) {
        var lineData = data[lineLoop].split(" ");

        if (lineData[1] === husband) {
          for (
            let counterLoop = lineLoop + 1;
            counterLoop < data.length;
            counterLoop++
          ) {
            var nameLineData = data[counterLoop].split(" ");

            if (nameLineData[1] === "BIRT") {
              husbandBirthday = data[counterLoop + 1]
                .split(" ")
                .slice(2, data[counterLoop + 1].length)
                .join(" ");
              break;
            }
          }
        }
      }

      for (let lineLoop = 0; lineLoop < data.length; lineLoop++) {
        var lineData = data[lineLoop].split(" ");

        if (lineData[1] === wife) {
          for (
            let counterLoop = lineLoop + 1;
            counterLoop < data.length;
            counterLoop++
          ) {
            var nameLineData = data[counterLoop].split(" ");

            if (nameLineData[1] === "BIRT") {
              wifeBirthday = data[counterLoop + 1]
                .split(" ")
                .slice(2, data[counterLoop + 1].length)
                .join(" ");
              break;
            }
          }
        }
      }

      if (familyLineData[1] === "CHIL") {
        var child = familyLineData[2];

        for (let lineLoop = 0; lineLoop < data.length; lineLoop++) {
          var lineData = data[lineLoop].split(" ");

          if (lineData[1] === child) {
            for (
              let counterLoop = lineLoop + 1;
              counterLoop < data.length;
              counterLoop++
            ) {
              var nameLineData = data[counterLoop].split(" ");

              if (nameLineData[1] === "BIRT") {
                childBirthday = data[counterLoop + 1]
                  .split(" ")
                  .slice(2, data[counterLoop + 1].length)
                  .join(" ");
                break;
              }
            }
          }
        }

        var childDate = new Date(Date.parse(childBirthday));
        var husbandDate = new Date(Date.parse(husbandBirthday));
        var wifeDate = new Date(Date.parse(wifeBirthday));

        var currDate = new Date();

        var childAge = Math.floor(
          (currDate.getTime() - childDate.getTime()) / 31557600000
        );
        var husbandAge = Math.floor(
          (currDate.getTime() - husbandDate.getTime()) / 31557600000
        );
        var wifeAge = Math.floor(
          (currDate.getTime() - wifeDate.getTime()) / 31557600000
        );

        var famOneIncrement;
        if (data[line - 3].split(" ")[2] === "FAM") {
          famOneIncrement = 3;
        } else {
          famOneIncrement = 5;
        }

        if (wifeAge - childAge >= 60) {
          errors.push(
            `ERROR: FAMILY: US12: ${data[line - famOneIncrement]
              .split(" ")[1]
              .replace(/[@]/g, "")}: Age of Mother ${wife.replace(
              /[@]/g,
              ""
            )} should be less than 60 years older than her children.`
          );
        }

        if (husbandAge - childAge >= 80) {
          errors.push(
            `ERROR: FAMILY: US12: ${data[line - famOneIncrement]
              .split(" ")[1]
              .replace(/[@]/g, "")}: Age of Father ${husband.replace(
              /[@]/g,
              ""
            )} should be less than 80 years older than his children.`
          );
        }

        // console.log(
        //   `Child ${child} age: ${childAge} of Father ${husband} Age: ${husbandAge} & Mother ${wife} Age: ${wifeAge}`
        // );
      }
    }
  }
}
//US13 Birth dates of siblings should be more than 8 months apart or less than 2 days apart (twins may be born one day apart, e.g. 11:59 PM and 12:02 AM the following calendar day)
for (let line = 0; line < data.length; line++) {
  var lineData = data[line].split(" ");
  if (lineData[2] === "FAM") {
    var FID = lineData[1].replace(/[@]/g, "");

    var children = [];

    for (let counter = line + 1; counter < data.length; counter++) {
      var familyLineData = data[counter].split(" ");
      if (familyLineData[2] === "FAM") {
        break;
      }

      if (familyLineData[1] === "CHIL") {
        var child = familyLineData[2];

        for (let lineLoop = 0; lineLoop < data.length; lineLoop++) {
          var lineData = data[lineLoop].split(" ");

          if (lineData[1] === child) {
            for (
              let counterLoop = lineLoop + 1;
              counterLoop < data.length;
              counterLoop++
            ) {
              var nameLineData = data[counterLoop].split(" ");

              if (nameLineData[1] === "BIRT") {
                childBirthday = data[counterLoop + 1]
                  .split(" ")
                  .slice(2, data[counterLoop + 1].length)
                  .join(" ");
                break;
              }
            }
          }
        }

        var childDate = new Date(Date.parse(childBirthday));

        children.push(childDate);
      }
    }

    for (childCount = 0; childCount < children.length; childCount++) {
      for (
        compareChild = childCount + 1;
        compareChild < children.length;
        compareChild++
      ) {
        if (
          Math.floor(
            (children[childCount] - children[compareChild]) / 86400000
          ) <= 2 ||
          Math.floor(
            (children[childCount] - children[compareChild]) / 86400000 / 12
          ) <= 8
        ) {
          errors.push(
            `ERROR: FAMILY: US13: ${FID}: Birth of children should be more than 8 months apart or less than 2 days apart.`
          );
        }
      }
    }
  }
}
//US14 No more than five siblings should be born at the same time
for (let line = 0; line < data.length; line++) {
  var lineData = data[line].split(" ");
  if (lineData[2] === "FAM") {
    var FID = lineData[1].replace(/[@]/g, "");

    var children = [];

    for (let counter = line + 1; counter < data.length; counter++) {
      var familyLineData = data[counter].split(" ");
      if (familyLineData[2] === "FAM") {
        break;
      }

      if (familyLineData[1] === "CHIL") {
        var child = familyLineData[2];

        for (let lineLoop = 0; lineLoop < data.length; lineLoop++) {
          var lineData = data[lineLoop].split(" ");

          if (lineData[1] === child) {
            for (
              let counterLoop = lineLoop + 1;
              counterLoop < data.length;
              counterLoop++
            ) {
              var nameLineData = data[counterLoop].split(" ");

              if (nameLineData[1] === "BIRT") {
                childBirthday = data[counterLoop + 1]
                  .split(" ")
                  .slice(2, data[counterLoop + 1].length)
                  .join(" ");
                break;
              }
            }
          }
        }

        var childDate = new Date(Date.parse(childBirthday));

        children.push(childDate);
      }
    }

    for (childCount = 0; childCount < children.length; childCount++) {
      var birthCount = 0;
      birthCount++;
      for (
        compareChild = childCount + 1;
        compareChild < children.length;
        compareChild++
      ) {
        if (
          Math.floor(
            (children[childCount] - children[compareChild]) / 86400000
          ) <= 2
        ) {
          birthCount++;
        }
      }
      if (birthCount > 5) {
        errors.push(
          `ERROR: FAMILY: US14: ${FID}: No more than five siblings can be born at the same time.`
        );
      }
    }
  }
}

//US15  Fewer than 15 siblings  There should be fewer than 15 siblings in a family
for (
  let familyDataElement = 0;
  familyDataElement < familyData.length;
  familyDataElement++
) {
  if (familyData[familyDataElement].Children.length > 15) {
    errors.push(
      `ERROR: FAMILY: US15: ${familyData[familyDataElement].ID}: More than 15 siblings in a family`
    );
  }
}

//US16  Male last names All male members of a family should have the same last name
for (
  let familyDataElement = 0;
  familyDataElement < familyData.length;
  familyDataElement++
) {
  nameArray = familyData[familyDataElement].HusbandName.split("/");
  familyLastname = nameArray[1];
  for (
    let childIndex = 0;
    childIndex < familyData[familyDataElement].Children.length;
    childIndex++
  ) {
    for (
      let indiDataElement = 0;
      indiDataElement < individualData.length;
      indiDataElement++
    ) {
      if (
        individualData[indiDataElement].ID ==
          familyData[familyDataElement].Children[childIndex] &&
        individualData[indiDataElement].Gender == "M"
      ) {
        childNameArray = individualData[indiDataElement].Name.split("/");
        childLastName = childNameArray[1];
        if (childLastName !== familyLastname) {
          errors.push(
            `ERROR: FAMILY: US16: child ${familyData[familyDataElement].Children[childIndex]} has a different last name than other male members of family ${familyData[familyDataElement].ID} `
          );
        }
      }
    }
  }
}

//US25 Unique first names in families
for (var family = 0; family < familyData.length; family++) {
  const childrenData = [];
  for (
    var children = 0;
    children < familyData[family].Children.length;
    children++
  ) {
    const child = familyData[family].Children[children];

    for (var people = 0; people < individualData.length; people++) {
      if (child === individualData[people].ID) {
        var childDOB = individualData[people].Birthday;
        var childName = individualData[people].Name;
        break;
      }
    }
    childrenData.push({
      ID: child,
      FID: familyData[family].ID,
      Name: childName,
      Birthday: childDOB,
    });
  }
  for (var loop = 0; loop < childrenData.length; loop++) {
    for (
      var innerLoop = loop + 1;
      innerLoop < childrenData.length;
      innerLoop++
    ) {
      if (
        childrenData[loop].Name === childrenData[innerLoop].Name &&
        childrenData[loop].Birthday === childrenData[innerLoop].Birthday
      ) {
        errors.push(
          `ERROR: FAMILY: US25: Name and DOB of ${childrenData[loop].ID} & ${childrenData[innerLoop].ID} are same in family ${childrenData[innerLoop].FID}`
        );
      }
    }
  }
}

//US27 Include individual ages
for (var people = 0; people < individualData.length; people++) {
  if (isNaN(individualData[people].Age)) {
    errors.push(
      `ERROR: ERROR: US27: Age of ${individualData[people].ID} is not included`
    );
  }
}

// Printing errors in GEDCOM file
for (error in errors) {
  console.log(errors[error]);
}
//US35 List recent births
for (var people = 0; people < individualData.length; people++) {
  if (individualData[people].Alive === true) {
    if (individualData[people].Birthday) {
      var curDate = new Date();

      var birthday = new Date(individualData[people].Birthday);

      if (
        (curDate.getTime() - birthday.getTime()) / (1000 * 3600 * 24) <= 30 &&
        (curDate.getTime() - birthday.getTime()) / (1000 * 3600 * 24) >= 0
      ) {
        errors.push(
          `LIST: INDIVIDUAL: US35: ${individualData[people].Name} (${individualData[people].ID}) was born within 30 days of current date`
        );
      }
    }
  }
}

//US36 List recent deaths
for (var people = 0; people < individualData.length; people++) {
  if (individualData[people].Alive === false) {
    if (individualData[people].Death) {
      var curDate = new Date();

      var death = new Date(individualData[people].Death);

      if (
        (curDate.getTime() - death.getTime()) / (1000 * 3600 * 24) <= 30 &&
        (curDate.getTime() - death.getTime()) / (1000 * 3600 * 24) >= 0
      ) {
        errors.push(
          `LIST: INDIVIDUAL: US36: ${individualData[people].Name} (${individualData[people].ID}) died within 30 days of current date`
        );
      }
    }
  }
}
