# bumper-board
## What Is It?

bumper-board is a project for a browser based customizable sound board, similar to the ones that you can find on the various phone app stores. You can create your own board with different effects, bumper tracks, etc, and then control where they appear, custom looping, automatic jumping between tracks, and more.

It is intended mainly for sound engineers who need to be able to quickly and easily switch between many tracks for a performance or show. For example, if you're doing a Game Show skit, you might have a generic bumper which should loop indefinitely, a Question bumper that should play as the question is being asked (and do a partial loop of the song if it isn't long enough), and a Right and Wrong bumper which should play through once then jump back to the generic bumper. Keeping track of all this through standard media players is next to impossible for one person, but it easy to configure within bumper-board to handle everything automatically.

## How do I get it?

It will be released as a Chrome App so you'll soon find it in the Chrome Web Store. There's still some work before it is ready for that, though, so until then you can fork the repository and serve it from any website (or local HTTP server). Note that the defaultboards.json file references some hard-coded paths to mp3s that are not included in the repository for copyright reasons. Please update this file with links to the appropriate mp3s on your server before loading for the first time. This is only temporary until the filesystem implementation is complete.


## What's coming in the future?

* Loading bumpers locally instead of from the server
* FileSystemAPI for storing tracks
* Full offline support (as a Chrome App)
* Sharing boards through a single .zip file
* Much improved UI design
* ... and other things I'm can't think of right now.
