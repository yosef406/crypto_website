
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

function searchCoins() {
    appendCards(coinsArr
        .filter((val) => val.name.toUpperCase().includes($("#searchInp").val().toUpperCase()))
    );
}

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

function showCoinInfo(event) {
    let sibling = $(this).parent().next();
    let coin = event.data.coin;
    let loading = $("<label>loading...</label>")
    if (sibling.css("display") == "none") {

        if (sibling.children().length != 3) {
            sibling.empty();
            fetcher(`https://api.coingecko.com/api/v3/coins/${coin.id}`, json => {
                loading.remove();
                if (json.image.large != undefined) {
                    sibling.append(`<div><img src="${json.image.large}" alt="${coin.name}"></div>`)
                }
                if (json.market_data.current_price.usd != undefined) {
                    sibling.append(`<label>USD: ${json.market_data.current_price.usd}$</label>`);
                    sibling.append(`<label>EUR: ${json.market_data.current_price.eur}€</label>`);
                    sibling.append(`<label>ILS: ${json.market_data.current_price.ils}₪</label>`);
                } else {
                    sibling.append(`<label>there is no data!</label>`);
                }

            });
            sibling.append(loading).show();
        }
        else {
            sibling.show();
        }
    }
    else {
        sibling.hide();
    }

}

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

function setHomeView() {
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
            .then((res) => {
                appendCards(res);
                coinsArr = res;
            });
        $("#cardHolder").append(`<h1>Loading</h1>`);
    } else {
        appendCards(coinsArr);
    }
}

function appendCards(coins) {
    $("#cardHolder").empty();
    coins.map((val) => {
        $("#cardHolder").append(card(val));
    });
}

async function fetcher(api, jsonCallback) {
    return await fetch(api)
        .then((res) => res.json()).then(jsonCallback)
        .catch((err) => console.log(err));
}


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

function toggledPopUp(coin, toggleBtn) {
    console.log("popUp " + coin.symbol);
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