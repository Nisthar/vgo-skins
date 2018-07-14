"use strict";

/**
 * A function that takes all the bets from the current round and returns the total sum of money bet
 * @method getTotal
 * @param {Array} stakesList is an array containing the current round's bets
 * @return {int} the total amount of money that was bet this round
 */
function getTotal(stakesList) {
    let myTotal = 0;
    for (let j = 0; j < stakesList.length; j++) {
        myTotal += Math.round(stakesList[j].stake);
    }
    return myTotal;
}

/**
 * A function that takes the users that bet this round and lists them on the screen
 * @method listUsers
 * @param {Array} stakesList is an array containing the current round's bets
 */
function listUsers(stakesList) {

    stakesList.sort(function(a, b) {
        if (a.stake < b.stake)
            return -1;
        if (a.stake > b.stake)
            return 1;
        return 0;
    });

    let total = getTotal(stakesList);
    $(".jackpot-score > .amount").text(`$${total}`);
    document.getElementsByClassName("score")[6].textContent = `$${total}`;

    document.getElementsByClassName("score")[3].textContent = stakesList.length;
    document.getElementsByClassName("score")[0].innerHTML = `${(currentMoneyGambled/total*100).toFixed(2)}<small>%</small>`;

    let usersList = document.createDocumentFragment();
    console.log(stakesList);

    for(let i = stakesList.length-1; i >= 0; i--) {

        let playerDiv = document.createElement("div");
        playerDiv.setAttribute("class", "row");

        let playerInfoDiv = document.createElement("div");
        playerInfoDiv.setAttribute("class", "col");
        let playerAvatarHolder = document.createElement("span");
        playerAvatarHolder.setAttribute("id", `playerholder-${stakesList[i].id}`);
        playerAvatarHolder.setAttribute("class", "avatar");
        playerAvatarHolder.style.border = `solid 4px ${stakesList[i].color}`;
        setArrowColor(`playerholder-${stakesList[i].id}`, stakesList[i].color);
        let playerAvatar = document.createElement("img");
        playerAvatar.setAttribute("src", stakesList[i].avatar);
        playerAvatar.setAttribute("alt", "Player");
        playerAvatarHolder.appendChild(playerAvatar);
        let playerName = document.createElement("span");
        playerName.setAttribute("class", "name");
        playerName.textContent = stakesList[i].user;
        
        playerInfoDiv.appendChild(playerAvatarHolder);
        playerInfoDiv.appendChild(playerName);

        let playerDataDiv = document.createElement("div");
        playerDataDiv.setAttribute("class", "col");
        let playerAmountBet = document.createElement("span");
        playerAmountBet.setAttribute("class", "amonut");
        playerAmountBet.textContent = `$${stakesList[i].stake}`;
        let playerItemCount = document.createElement("span");
        playerItemCount.setAttribute("class", "items");
        playerItemCount.textContent = "(16 Items)";
        let playerStakeRatio = document.createElement("span");
        playerStakeRatio.setAttribute("class", "ratio");
        playerStakeRatio.textContent = `${(stakesList[i].stake/total*100).toFixed(2)}%`;

        playerDataDiv.appendChild(playerAmountBet);
        playerDataDiv.appendChild(playerItemCount);
        playerDataDiv.appendChild(playerStakeRatio);

        playerDiv.appendChild(playerInfoDiv);
        playerDiv.appendChild(playerDataDiv);

        let playerDivHolder = document.createElement("div");
        playerDivHolder.setAttribute("class", "player");
        playerDivHolder.appendChild(playerDiv);
        usersList.appendChild(playerDivHolder);
    }

    let usersListElement = document.getElementsByClassName("player-list")[0];
    usersListElement.innerHTML = '';
    usersListElement.appendChild(usersList);
}

/**
 * A function that takes the users that bet this round and draws a pie chart where the slices are
 *  proportional to the value bet by the player
 * @method plotData
 * @param {Array} stakesList is an array containing the current round's bets
 */
function plotData(stakesList) {

    let chartData = { names: [], stakes: [], colors: [], avatars: [] };

    for(let stake of stakesList) {
        chartData.names.push(stake.user);
        chartData.stakes.push(stake.stake);
        chartData.colors.push(stake.color);
        chartData.avatars.push({
            src: stake.avatar,
            width: 30,
            height: 30
        });
    }

    console.log(chartData);
    plotStakes("doughnut", chartData);
}

/**
 * A function that fetches the items owned by the player and lists them in the bet items modal
 * @method listModalItems
 */
function listModalItems() {

    let mockImg = "https://files.opskins.media/file/vgo-img/item/dual-berettas-trigger-happy-battle-scarred-300.png";
    let mockName = "MAG-7 Gold Digger (Factory New)";
    let items = [{ id: 1, name: mockName, price: 7.13, image: { "--300px": mockImg}}, 
    { id: 2, name: mockName, price: 3.12, image: { "--300px": mockImg}}, { id: 3, name: mockName, price: 1.27, image: { "--300px": mockImg}}, 
    { id: 4, name: mockName, price: 2.32, image: { "--300px": mockImg}}, { id: 5, name: mockName, price: 15.73, image: { "--300px": mockImg}}, 
    { id: 6, name: mockName, price: 7.14, image: { "--300px": mockImg}}, { id: 7, name: mockName, price: 9.23, image: { "--300px": mockImg}}, 
    { id: 8, name: mockName, price: 3.14, image: { "--300px": mockImg}}];

    selectedItems = currentSelectedItems ? currentSelectedItems : {};
    totalMoneyGambled = currentMoneyGambled ? currentMoneyGambled : 0;

    let itemsList = document.createDocumentFragment();

    let itemsRow = document.createElement("div");
    itemsRow.setAttribute("class", "row");
    let columnIndex = 0;

    for(let item of items) {

        let itemContainer = document.createElement("div");
        if(selectedItems.hasOwnProperty(item.id)) {
            itemContainer.setAttribute("class", "col selected-item");    
        } else {
            itemContainer.setAttribute("class", "col");
        }
        itemContainer.setAttribute("id", item.id);
        itemContainer.onclick = selectItem;
        let itemHolder = document.createElement("div");
        itemHolder.setAttribute("class", "skin-item");

        let topSection = document.createElement("div");
        topSection.setAttribute("class", "top-sec");
        let itemCode = document.createElement("span");
        itemCode.setAttribute("class", "code");
        itemCode.textContent = "MM";
        let itemPrice = document.createElement("span");
        itemPrice.setAttribute("class", "amount");
        itemPrice.textContent = `$${item.price}`;
        topSection.appendChild(itemCode);
        topSection.appendChild(itemPrice);

        let midSection = document.createElement("div");
        midSection.setAttribute("class", "mid-sec");
        let itemImage = document.createElement("img");
        itemImage.setAttribute("src", item.image["--300px"]);
        midSection.appendChild(itemImage);

        let bottomSection = document.createElement("div");
        bottomSection.setAttribute("class", "bottom-sec");
        bottomSection.textContent = item.name;
        
        itemHolder.appendChild(topSection);
        itemHolder.appendChild(midSection);
        itemHolder.appendChild(bottomSection);
        itemContainer.appendChild(itemHolder);
        itemsRow.appendChild(itemContainer);

        columnIndex++;
        if(columnIndex == 5) {
            itemsList.appendChild(itemsRow);
            itemsRow = document.createElement("div");
            itemsRow.setAttribute("class", "row");
            columnIndex = 0;
        }
    }

    if(columnIndex > 0) {
        itemsList.appendChild(itemsRow);
    }

    let itemsElementList = document.getElementsByClassName("data-content")[0];
    itemsElementList.innerHTML = '';
    itemsElementList.appendChild(itemsList);
    $(".modal-content .row .score-panel .item .score:eq(1)").text(`$${currentMoneyGambled.toFixed(2)}`);
    $(".data-panel .bottom-sec button").text(`Deposit $${currentMoneyGambled.toFixed(2)} (0 Skins)`);
    totalMoneyGambled = currentMoneyGambled;
    selectedItems = Object.assign({}, currentSelectedItems);
}

/**
 * A function that calls the plotData and listUsers functions
 * @method refreshScreen
 * @param {Array} stakesList is an array containing the current round's bets
 */
function refreshScreen(stakesList) {
    
    plotData(stakesList);
    listUsers(stakesList);
}

$(document).ready(function() {

    $(".jackpot-btn > button").on("click", listModalItems);
    $("#roulette-modal").on('hidden.bs.modal', clearSelection);
    $(".data-panel .bottom-sec button").on("click", submitSelection);
});