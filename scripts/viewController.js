class ViewController {
    View = {
        HOME: 'home',
        REPORT: 'report',
        ABOUT: 'about'
    }

    #viewContainer = $(`#masterView`);
    #homePage = $(` <div class="cardHolder" id="cardHolder"></div>`);
    #reportPage = $(`
    <div class="reportSection" id="reportSection">
        <h1 id="chartWarning">Please choose coins to display a live report</h1>
        <div id="chartContainer"></div>
    </div>`
    );
    #aboutPage = $(`<div class="aboutSection" id="aboutSection"></div>`);

    #searchContainer = $("#searchContainer");

    constructor(callback) {
        this.#viewContainer.append(this.#homePage)
        callback();
    }

    switchView(newView, callback, passParam) {
        switch (newView) {
            case this.View.HOME:
                this.#searchContainer.show();
                this.#viewContainer.empty()
                    .append(this.#homePage);
                if (callback != null) callback(passParam);
                break;

            case this.View.REPORT:
                this.#searchContainer.hide();
                this.#viewContainer.empty()
                    .append(this.#reportPage);
                if (callback != null) callback(passParam);
                break;

            case this.View.ABOUT:
                this.#searchContainer.hide();
                this.#viewContainer.empty()
                    .append(this.#aboutPage);
                if (callback != null) callback(passParam);
                break;

            default:
                break;
        }
    }
}