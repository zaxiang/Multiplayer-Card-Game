# Introduction

In this assignment, you are going to beef up the appearance and function of the card game example from lecture 10.

# Assignment Tasks

1. Pull the latest examples repo and copy the `ui/` and `server/` subdirectories of the `lecture10-card-game/` directory into your assignment directory. Commit and push this before proceeding to the next step.

2. Create a `ui/src/components/AnimatedCard.vue` component to replace the `<pre>`-based rendering of individual cards. The component needs to use at least one prop and emit at least one event. The component needs to visually differentiate between the last played card vs. player cards, as well as show when a card is not legal to play *without* the user needing to click on it to try playing it. HINT: `import` a helper function from the `server/` directory to do this. 

3. Add an array parameter to the `game-state` event emitted by `server.ts` that includes a list of the players who have only 1 card left in their hand or fewer.

4. Update `Game.vue` to use the information from step 3 to show which players have only 1 or fewer cards left in their hands. You are free to present this in any way you want.

5. Change the game logic on the server side to make queens "wild". In other words, you can always play a queen regardless of the last card played. In addition to providing flexibility to the player playing the queen, it also gives flexibility to the player that plays after the queen, because any card of theirs will also match the queen. 

6. Add 2 new socket.io event handlers to `server.ts` called `get-config` and `update-config` and add a new `interface Config` to `model.ts`. The purpose of this is so that the number of decks of cards and rank limit can be dynamically configured while the server is running. `update-config` should take a single `Config` parameter. In response to the two events, the server should send out two events, `get-config-reply` and `update-config-reply`, respectively. For `update-config-reply`, it should return a single `boolean` parameter that should be `false` if, by using `typeof`-based checks, the supplied `config` does not conform to the needed type or has extra fields. Finally, `update-config-reply` needs to be sent out after waiting 2 seconds after receiving `update-config`. Successful saving of a new configuration (no need to check if the configuration actually changed or not) should cause the game to start over from scratch, and an `update-config-reply` event with a `true` parameter as well as any other events that are needed to signal a new game need to be sent out. There is no need to load/save this configuration on disk. 

7. Add a button to the player page that shows a `<b-modal>` modal dialog box with a form for configuring the number of decks of cards and the rank limit. Use the `number` attribute on the `<b-form-input>` to automatically parse the string input into a `number`. Load the configuration from the server with a `get-config` event when the `<b-modal>` becomes visible using its `@shown` event. Use a `<b-overlay>` to prevent the user from using the modal until after the current configuration is received via a `get-config-reply`. Similarly, when the user clicks OK on the modal to save changes, put up the `<b-overlay>` and do not hide the modal until the `update-config-reply` response event is received. (There is no explicit requirement to do anything specific if no `update-config-reply` `true` is received.)

8. Use Panopto to make a short demo video to share with the instructor and the 3 course TAs prior to the due date. The video needs to include 2 complete games played end to end (have two web browsers positioned side by side), demonstrating the visual features from steps 2, 4, 5, and 7. In between the two games, use the configuration dialog box to change the parameters to something obviously different, so that we can easily see that the configuration setting feature works.