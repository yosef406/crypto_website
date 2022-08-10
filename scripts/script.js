
/**
 * @param {*} coinsArr the coins that have been fetched from the API and are on the home page
 * @param {*} reportObjects the list of coins that are supposed to be added to the live report chart
 * @param {*} viewController a class that controls the navigation
 * @param {*} interval this is the interval that is used in the chart function it is used to stop the function when navigating to another page
 */
var coinsArr = [];
let reportObjects = [];
let viewController = new ViewController(setHomeView);
let interval;

$(document).ready(async () => {

    $("#homeBtn").click(() => {
        clearInterval(interval);
        viewController
            .switchView(viewController.View.HOME, setHomeView)
    });

    $("#reportBtn").click(() => viewController
        .switchView(viewController.View.REPORT, buildChart));

    $("#aboutBtn").click(() => {
        clearInterval(interval);
        viewController
            .switchView(viewController.View.ABOUT, buildAboutPage)
    });

    $("#searchBtn").click(searchCoins);
});

/**
 * searches threw the coins to find coins that includes 
 * the string that is in the search bar
 */
function searchCoins() {
    appendCards(coinsArr
        .filter((val) => val.name.toUpperCase().includes($("#searchInp").val().toUpperCase()))
    );
}

/**
 * builds a card that includes the name, symbol and the controls buttons for each coin
 * and it includes the sections for additional info or a loading bar
 * @param {*} coin the coin to build the card for
 * @returns the card that was built 
 */
function card(coin) {
    let card = $(`<div class="card"></div>`);
    let checkBox = $(`<input type="checkbox" ${reportObjects.includes(coin) ? "checked" : ""} >`).change({ coin }, addToReport)

    let ToggleButton = $(`<label class="switch"></label>`)
        .append(checkBox)
        .append(`<span class="slider round"></span>`);

    let symbolDiv = $(`<div><h2>${coin.name}</h2></div>`)
        .append(ToggleButton);

    let infoBtn = $(`<button>More Info</button>`)
        .click({ coin }, showCoinInfo);
    let coinInfo = $(`<div class="infoSection"></div>`)
        .append($("<div></div>").append(infoBtn))
        .append($(`<div class="coinInfo"></div>`).hide());

    card.append(symbolDiv)
        .append(`<h4>${coin.symbol}</h4>`)
        .append(coinInfo);
    return card;
}

/**
 * this function is used only threw a button (the more info button) on each coin card
 * this function checks the session storage for stored info about the coin
 * if there are no info in the session storage or the info was stored over two minutes ago
 * the function will fetch the info from an api and store it in the session storage
 * then the info will be added to the card that contains the button that ran the function
 * @param {*} event a jQuery click event that holds info about the button
 */
function showCoinInfo(event) {
    let sibling = $(this).parent().next();
    let coin = event.data.coin;
    let loading = $(`<div class="progressBar">
                        <div id="progressIndicator" class="progressIndicator">20%</div>
                    </div>`);
    let cache = sessionStorage.getItem(coin.id);
    let cacheObj = {};
    if (cache) {
        cacheObj = JSON.parse(sessionStorage.getItem(coin.id));
    }

    let time = Date.now();
    let twoMinutes = 2 * 60 * 1000;

    if (sibling.css("display") == "none") {
        if (sibling.children().length != 3) {
            sibling.empty();
            if (cache == null || time - cacheObj.time > twoMinutes) {
                fetcher(`https://api.coingecko.com/api/v3/coins/${coin.id}`, async (json) => {
                    await moveProgressBar(loading);
                    loading.remove();

                    cacheObj.img = json.image.large;
                    cacheObj.usd = json.market_data.current_price.usd;
                    cacheObj.eur = json.market_data.current_price.eur;
                    cacheObj.ils = json.market_data.current_price.ils;
                    cacheObj.time = time;
                    infoAppend(cacheObj, sibling);
                    sessionStorage.setItem(coin.id, JSON.stringify(cacheObj))
                });
                sibling.append(loading).show();
            }
            else {
                infoAppend(cacheObj, sibling);
                sibling.show();
            }
        }
        else {
            sibling.show();
        }
    }
    else {
        sibling.hide();
    }
}

/**
 * this function appends the coin info that was fetched in the showCoinInfo function
 * @param {*} obj the object that holds the info
 * @param {*} sibling the <div> where to add the info
 */
function infoAppend(obj, sibling) {
    sibling.append(`<div class="imageDiv"><img src="${obj.img}" alt="image not found"></div>`)
    if (obj.usd != undefined && obj.eur != undefined && obj.ils != undefined) {
        sibling.append(`<label>USD: ${obj.usd}$</label>`);
        sibling.append(`<label>EUR: ${obj.eur}€</label>`);
        sibling.append(`<label>ILS: ${obj.ils}₪</label>`);
    }
    else {
        sibling.append(`<label>there is no data!</label>`);
    }
}

/**
 * this function is used to animate the progress bar for loading
 * @param {*} loading the progress bar element 
 * @returns a promise that resolves when the progress bar reaches 100%
 */
function moveProgressBar(loading) {
    return new Promise((resolve, reject) => {
        let elem = loading.children("#progressIndicator");
        let width = 20;

        let frame = () => {
            if (width >= 100) {
                clearInterval(id);
                resolve();
            } else {
                width++;
                elem.css("width", width + '%');
                elem.html(width * 1 + '%');
            }
        }
        let id = setInterval(frame, 10);
    });
}


/**
 * adds a coin to the reportObjects array that is used to display the report chart
 * @param {*} event a jQuery click event that holds info about the button
 */
function addToReport(event) {
    let coin = event.data.coin;
    if (!reportObjects.includes(coin)) {
        if (reportObjects.length < 5)
            reportObjects.push(coin);
        else {
            this.checked = toggledPopUp(coin, this);
        }
    } else {
        let index = reportObjects.indexOf(coin);
        reportObjects.splice(index, 1);
    }
}

/**
 * fetches the coins list from the API and filters the results
 * then uses the appendCards function to populate the home page
 */
function setHomeView() {
    let loading = $(`<div class="progressBar">
                        <div id="progressIndicator" class="progressIndicator">20%</div>
                    </div>`);
    if (coinsArr.length == 0) {
        fetcher("https://api.coingecko.com/api/v3/coins/list", (json) => {
            let count = 0;
            return json.filter((val, index) => {
                if (val.name.length < 10 && index % 15 == 0 && count < 100) {
                    count++;
                    return true;
                }
                return false;
            })
        })
            .then(async (res) => {
                await moveProgressBar(loading)
                appendCards(res);
                coinsArr = res;
            });
        $("#cardHolder").append($("<div><h1>Loading...</h1></div>").append(loading));
    } else {
        appendCards(coinsArr);
    }
}

/**
 * appends the coins cards to the home page
 * @param {*} coins the list of coins to add to the home page
 */
function appendCards(coins) {
    $("#cardHolder").empty();
    coins.map((val) => {
        $("#cardHolder").append(card(val));
    });
}

/**
 * fetches data from a given API 
 * @param {*} api the API to fetch from
 * @param {*} jsonCallback a function to run when the data is returned from the json() function
 * @returns the fetch function
 */
async function fetcher(api, jsonCallback) {
    return await fetch(api)
        .then((res) => res.json()).then(jsonCallback)
        .catch((err) => console.log(err));
}

/**
 * builds the live report chart 
 * this is an edited version of the function given from https://canvasjs.com/jquery-charts/
 * this function checks reportObjects for the coins to build the chart for
 * then it sets an interval function that fires every two seconds to fetch the data and display it 
 */
function buildChart() {
    if (reportObjects.length < 1) {
        $("#chartWarning").show();
        $("#chartContainer").hide();
    }
    else {
        $("#chartWarning").hide();
        $("#chartContainer").show();
    }

    var dataPoints = [];
    let optionsData = [];
    let symbolsStr = reportObjects.map((val) => val.symbol);
    let nameStr = reportObjects.map((val) => val.name);

    for (let i = 0; i < reportObjects.length; i++) {
        dataPoints.push([]);
        optionsData.push({
            type: "spline",
            xValueType: "dateTime",
            yValueFormatString: "0.#####$",
            xValueFormatString: "hh:mm:ss TT",
            showInLegend: true,
            name: nameStr[i],
            dataPoints: dataPoints[i],

        });
    }

    var options = {
        theme: "light2",
        title: {
            text: `Crypto to USD`
        },
        axisY: {
            suffix: "$",
        },
        legend: {
            cursor: "pointer",
            verticalAlign: "top",
            fontSize: 22,
            fontColor: "dimGrey",
            itemclick: toggleDataSeries,
        },
        data: optionsData
    };
    function toggleDataSeries(e) {
        if (typeof e.dataSeries.visible === "undefined" || e.dataSeries.visible) {
            e.dataSeries.visible = false;
        } else {
            e.dataSeries.visible = true;
        }
        e.chart.render();
    }

    $("#chartContainer").CanvasJSChart(options);

    let apiStr = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbolsStr}&tsyms=USD`;
    interval = setInterval(() => {
        let time = new Date();
        fetcher(apiStr, (json) => {
            for (let i = 0; i < reportObjects.length; i++) {
                if (json[reportObjects[i].symbol.toUpperCase()] != undefined)
                    dataPoints[i]
                        .push({
                            x: time.getTime(),
                            y: json[reportObjects[i].symbol.toUpperCase()].USD
                        });
                else dataPoints[i]
                    .push({
                        x: time.getTime(),
                        y: "no data"
                    });

                let result = dataPoints[i][dataPoints[i].length - 1].y;

                options.data[i].legendText = `${nameStr[i]}: ${result} ${result == "no data" ? "" : "$"}`
                if (dataPoints[i].length > 100) dataPoints[i].shift();
            }
        });

        $("#chartContainer").CanvasJSChart().render();
    }, 2000);

}

/**
 * builds the about page and appends all the headers and paragraphs
 */
function buildAboutPage() {
    let aboutSection = $(`#aboutSection`).empty();
    let page = $(`<div class="page"></div>`)
        .append(`<h1>About Us</h1>`).append(`<hr>`)
        .append(`<div> <h2>Creator: </h2> <h3> Yosef Awad</h3> </div>`)
        .append(`<div> <h2>Creator Email: </h2> <h3> Yosef.Awad.1@gmail.com</h3> </div>`)
        .append("<hr>")
        .append(`<div> <h3>About the website</h3> <br> </div>`)
        .append(`<div><p>
        Cryptonite is a website for watching and following information about crypto currency,<br>
        here you will be able to browse and view different crypto currencies,you will see the currency name and its symbol,
        you also have the option to view additional info like the image of the currency and its value in US Dollars, Euro and New Israeli Shekel.<br>
        if you wish to follow a the rise and fall of a currency's value you ca do so with a toggle to add up to 
        five to a live report that will display a cart with all currencies selected,
        you will be able to see the live report chart by navigating to the live report section.<br>
        </p></div><hr>`)
        .append(`<div> <h3>Terms and conditions</h3> <br> </div>`)
        .append(`<div><h4>Introduction</h4></div>`)
        .append(`<div><p>
        These Website Standard Terms and Conditions written on this webpage shall manage your use of our website, 
        Cryptonite accessible at Cryptonite.com.
        These Terms will be applied fully and affect to your use of this Website. By using this Website, 
        you agreed to accept all terms and conditions written in here. 
        You must not use this Website if you disagree with any of these Website Standard Terms and Conditions.
        Minors or people below 18 years old are not allowed to use this Website.
        </p></div>`)
        .append(`<div><h4>Intellectual Property Rights</h4></div>`)
        .append(`<div><p>
        Other than the content you own, under these Terms, 
        Crypto Watch and/or its licensors own all the intellectual property rights and materials contained in this Website.
        You are granted limited license only for purposes of viewing the material contained on this Website.
        </p></div>`)
        .append(`<div><h4>Restrictions</h4></div>`)
        .append(`<div><p>You are specifically restricted from all of the following: <br></p></div>`)
        .append(`<div><ul>
        <li>publishing any Website material in any other media; </li>
        <li>selling, sublicensing and/or otherwise commercializing any Website material; </li>
        <li>publicly performing and/or showing any Website material; </li>
        <li>using this Website in any way that is or may be damaging to this Website; </li>
        <li>using this Website in any way that impacts user access to this Website; </li>
        <li>using this Website contrary to applicable laws and regulations, or in any way may cause harm to the Website, or to any person or business entity; </li>
        <li>engaging in any data mining, data harvesting, data extracting or any other similar activity in relation to this Website; </li>
        <li>using this Website to engage in any advertising or marketing. </li>
        </ul></div>`)
        .append(`<div><p>
        Certain areas of this Website are restricted from being access by you and Company 
        Name may further restrict access by you to any areas of this Website, at any time, 
        in absolute discretion. Any user ID and password you may have for 
        this Website are confidential and you must maintain confidentiality as well.
        <br></p></div>`)
        .append(`<div><h4>Your Content</h4></div>`)
        .append(`<div><p>
        In these Website Standard Terms and Conditions, "Your Content" shall mean any audio, 
        video text, images or other material you choose to display on this Website. 
        By displaying Your Content, you grant Company Name a non-exclusive, 
        worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, 
        translate and distribute it in any and all media.<br>
        Your Content must be your own and must not be invading any third-party's rights. 
        Crypto Watch reserves the right to remove any of Your Content from this Website at any time without notice.
        <br></p></div>`)

    aboutSection.append(page);
}

/**
 * creates a popup window that is created when there are five coins in reportObjects and the user attempts to add a sixth one
 * it displays all the coins that have ben added 
 * if the user cancels the coin that was pressed will not be added and the popup will be removed 
 * if the user decides to remove a coin from the list the coin that was pressed will be added instead
 * @param {*} coin the coin that the user attempted to add
 * @param {*} toggleBtn the toggle button that was pressed it is required so the it can be checked or unchecked
 */
function toggledPopUp(coin, toggleBtn) {
    let coinsWrapper = $(`<div class="coinsWrapper"></div>`)
        .append(reportObjects.map((val, index) => {
            return $(`<div class="reportList"><h2>${val.name}</h2><div>`)
                .append($(`<button>remove</button>`)
                    .click(() => {
                        reportObjects.splice(index, 1);
                        reportObjects.push(coin);
                        popUp.remove();
                        setHomeView();
                    })
                );
        }))
        .append($(`<button>Cancel</button>`).click(() => {
            toggleBtn.checked = false;
            popUp.remove();
        }));

    let popUp = $(`<div class="popUpAlert"></div>`)
        .append(coinsWrapper);
    $('body').append(popUp);
}