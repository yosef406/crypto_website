class reportController {
    #reportObjects;
    #interval;
    constructor() {
        this.#reportObjects = [];
    }
    add(obj) {
        if (this.#reportObjects.length < 5) {
            this.#reportObjects.push(obj);
            // console.log(this.#reportObjects.length);
            return true;
        }
        return false;
    }

    remove(obj) {
        let index = this.#reportObjects.indexOf(obj);
        this.#reportObjects.splice(index, 1);
    }

    includes(obj) {
        return this.#reportObjects.includes(obj);
    }


    buildChart() {
        // console.log(this.#reportObjects);
        console.log(this.#reportObjects);

        if (this.#reportObjects.length < 1) {
            $("#chartWarning").show();
            $("#chartContainer").hide();
        }
        else {
            $("#chartWarning").hide();
            $("#chartContainer").show();
        }

        var dataPoints = [];
        let optionsData = [];
        let symbolsStr = this.#reportObjects.map((val, index) => val.symbol);

        for (let i = 0; i < this.#reportObjects.length; i++) {
            dataPoints.push([]);
            optionsData.push({
                type: "spline",
                xValueType: "dateTime",
                yValueFormatString: "0.#####$",
                xValueFormatString: "hh:mm:ss TT",
                showInLegend: true,
                name: symbolsStr[i],
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
        this.#interval = setInterval(() => {
            let time = new Date();
            fetch(apiStr)
                .then((res) => res.json())
                .then((json) => {
                    for (let i = 0; i < this.#reportObjects.length; i++) {
                        if (json[this.#reportObjects[i].symbol.toUpperCase()] != undefined)
                            dataPoints[i]
                                .push({
                                    x: time.getTime(),
                                    y: json[this.#reportObjects[i].symbol.toUpperCase()].USD
                                });
                        else dataPoints[i]
                            .push({
                                x: time.getTime(),
                                y: "no data"
                            });

                        let result = dataPoints[i][dataPoints[i].length - 1].y;

                        options.data[i].legendText = `${symbolsStr[i]}: ${result} ${result == "no data" ? "" : "$"}`
                    }
                })
                .catch((err) => console.log(err));
            $("#chartContainer").CanvasJSChart().render();
        }, 2000);

    }

    stop() {
        clearInterval(this.#interval);
    }

}