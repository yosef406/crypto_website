
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
            .switchView(viewController.View.ABOUT)
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