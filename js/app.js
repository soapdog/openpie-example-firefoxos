/**
 * OpenPie Example for Firefox OS
 *
 * author: Andre Alves Garzia (mailto:andre@andregarzia.com)
 * Date: 3 of April, 2013
 *
 * This app uses jsqrcode from https://github.com/LazarSoft/jsqrcode/
 *
 * Permissions:
 *
 * systemXHR - for cross-domain GET requests.
 * Alarms - to schedule events.
 *
 */

var homeScreen;
var eventScreen;
var pieObj = null;

function eatThatPie(e) {
    pieObj = JSON.parse(this.responseText);
    console.log(pieObj);

    if (pieObj.itemtype == "http://schema.org/Event") {
        homeScreen.classList.add("hidden");
        eventScreen.classList.remove("hidden");

        document.querySelector("#event-name").innerHTML = pieObj.name;
        document.querySelector("#event-description").innerHTML = pieObj.description;
        document.querySelector("#event-start-date").innerHTML = pieObj.startDate;
    }

}

function addToSchedule() {
    var alarmId1;
    var description =  pieObj.name + " - " + pieObj.description;
    var request = navigator.mozAlarms.add(new Date(pieObj.startDate), "honorTimezone",{mydata: description});

    console.log("request", request);

    request.onsuccess = function (event) {
        console.log("AlarmAPI: " + event.target.result);
        alarmId1 = event.target.result;

        if (alarmId1) {
            alert("Event Scheduled!");
        }
    };

     request.onerror = function (event) {
        console.log("Error AlarmAPI: " + event.target.error.name);

        if (event.target.error.name == "InvalidStateError") {
            alert("Can't schedule event in the past!");
        }
    };
}

function backToHome() {
    pieObj = null;
    eventScreen.classList.add("hidden");
    homeScreen.classList.remove("hidden");
}


function captureQRCode() {

    /**
     * Use a mozActivity to fetch a QR Code from the camera or
     * the gallery.
     * @type {MozActivity}
     */
    var pick = new MozActivity({
        name: "pick",
        data: {
            type: ["image/jpg", "image/png", "image/jpeg"]
        }


    });

    /**
     * This is the successful callback from the pick activity.
     * If we reached this point, we have an image blob to use.
     *
     * We'll pass this image blob to the QR decode library. Once in the
     * QR decoder callback we check to see if the data from the code is a URL.
     * If it is, we fetch it using an AJAX GET request and then feed the resulting
     * response to the eatThatPie() function.
     */
    pick.onsuccess = function() {
        console.log("pick success!!");
        var theresult = this.result;

        /**
         * Below is the callback for the QR decoder.
         * @param data
         */
        qrcode.callback = function(data) {
            console.log("qr code data: ", data);
            if (data.indexOf("http://") != -1 || data.indexOf("https://") != -1) {
                // It is URL!!! Fetch it!
                var xhr = new XMLHttpRequest({mozSystem: true});

                xhr.addEventListener("progress", updateProgress, false);
                xhr.addEventListener("load", transferComplete, false);
                xhr.addEventListener("error", transferFailed, false);
                xhr.addEventListener("abort", transferCanceled, false);

                xhr.onload = eatThatPie;

                xhr.open("GET", data, true);
                console.log("querying...(" + data + ")");
                xhr.send("");
            }
        };

        qrcode.decode(window.URL.createObjectURL(this.result.blob));
    };


    /**
     * We ignore pick errors.
     */
    pick.onerror = function() {
        console.log("error on pick !!!");
    };
}

function transferComplete(evt) {
    console.log("The transfer is complete.");
}

function transferFailed(evt) {
    console.log("An error occurred while transferring the file.");
    console.log(evt);
}

function transferCanceled(evt) {
    console.log("The transfer has been canceled by the user.");
}

function updateProgress (oEvent) {
    if (oEvent.lengthComputable) {
        var percentComplete = oEvent.loaded / oEvent.total;
        // ...
        console.log(percentComplete);
    } else {
        // Unable to compute progress information since the total size is unknown
        console.log("update progress error");
    }
}

window.onload = function () {
    homeScreen = document.querySelector("#home");
    eventScreen = document.querySelector("#new-event");

    // All the listeners for the interface buttons and for the input changes
    document.getElementById("get-pie").addEventListener("click", captureQRCode);
    document.getElementById("back-to-home").addEventListener("click", backToHome);
    document.getElementById("add-event").addEventListener("click", addToSchedule);

}