// show instagram profile on first ever install
chrome.runtime.onInstalled.addListener(async ({ reason: e, temporary: r }) => {
  switch (e) {
    case "install":
      await chrome.tabs.create({
        url: "https://www.instagram.com/ravvkush/",
      });
  }
}),

// context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({   
    id: "LiveIPLmatch",
    title: "Live IPL everyday              7:30pm",
    contexts: ["action"],
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({   
    id: "gotoTab",
    title: "Go to meet                  Ctrl/⌘ + ←",
    contexts: ["action", "page"],
  });
});

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "closeTab",
      title: "Close meet ",
      contexts: ["action", "page"],
    });
  });

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    parentId: "closeTab",
    id: "current",
    title: "Current meet tab                 Ctrl/⌘ + ↓",
    contexts: ["action", "page"],
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    parentId: "closeTab",
    id: "restall",
    title: "Close remaining tabs           Ctrl/⌘ + →",
    contexts: ["action", "page"],
  });
});
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "lastTab",
    title: "Reopen last tab           Ctrl/⌘ + ↑",
    contexts: ["action", "page"],
  });
});
// context menu callbacks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if ("current" === info.menuItemId) {
    close_tabs();
  } else if ("restall" === info.menuItemId) {
    close_alltabs();
  }else if ("gotoTab" === info.menuItemId) {
    goto_tab();
  }else if ("lastTab" === info.menuItemId) {
    last_tab();
  } else if ("LiveIPLmatch" === info.menuItemId) {
    live_ipl();
  } 
});


// commands callbacks
chrome.commands.onCommand.addListener(function (command) {
  if (command == "goto_tab") {
    goto_tab();
  } else if (command == "close_tabs") {
    close_tabs();
  }else if (command=="close_alltabs"){
    close_alltabs();
  }
  else if (command == "last_tab") {
    last_tab();
  }
});

// on click on button of extension
chrome.action.onClicked.addListener(function (tab) {
  goto_tab();
}); 

// go to meet active tab
function goto_tab() {
  var possibles = [];
  chrome.windows.getLastFocused(function (win) {
    var first_audible = false;
    var current_tab = false;

    const regex = new RegExp("/meet.google.com");

    chrome.tabs.query({}, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (regex.test(tabs[i].url || tabs[i].audible)) {
          if (tabs[i].active && tabs[i].windowId == win.id) {
            current_tab = tabs[i];
            break;
          }
        }
      }

      for (var i = 0; i < tabs.length; i++) {
        if (regex.test(tabs[i].url || tabs[i].audible)) {
          if (tabs[i] !== current_tab) {
            if (regex.test(tabs[i].url)) {
              possibles.push(tabs[i]);
            } else {
              console.log("No active meet tabs available");
            }
          }
        }
      }

      if (possibles.length) {
        var wins = {};
        var current_win = possibles[0].windowId;
        wins[current_win] = [];

        for (var i = 0; i < possibles.length; i++) {
          if (possibles[i].windowId !== current_win) {
            current_win = possibles[i].windowId;
            wins[current_win] = [];
          }

          wins[current_win].push(possibles[i]);
        }

        if (wins[win.id] === undefined) {
          wins[win.id] = [];
        }

        var keys = Object.keys(wins).sort();

        if (keys[0] !== String(win.id)) {
          var ind = keys.indexOf(String(win.id));
          var tail = keys.slice(ind + 1);
          keys.splice(ind);
          var winids = [String(win.id)].concat(tail).concat(keys);
        } else {
          var winids = keys;
        }

        for (var i = 0; i < winids.length; i++) {
          for (var j = 0; j < wins[winids[i]].length; j++) {
            var tab = wins[winids[i]][j];

            if (current_tab) {
              if (tab.windowId === current_tab.windowId) {
                if (tab.index > current_tab.index) {
                  chrome.tabs.update(tab.id, { active: true });
                  chrome.windows.update(tab.windowId, { focused: true });

                  return;
                }
              } else {
                chrome.tabs.update(tab.id, { active: true });
                chrome.windows.update(tab.windowId, { focused: true });

                return;
              }
            } else {
              chrome.tabs.update(tab.id, { active: true });
              chrome.windows.update(tab.windowId, { focused: true });
              return;
            }
          }
        }

        chrome.tabs.update(possibles[0].id, { active: true });
        chrome.windows.update(possibles[0].windowId, { focused: true });
        return;
      } else {
        if (current_tab.audible) {
          chrome.tabs.update(current_tab.id, { active: true });
          chrome.windows.update(current_tab.windowId, { focused: true });
          return;
        }
      }
    });
  });
}

// close current active tab
var lastactive = [];
function close_tabs() {
  chrome.windows.getLastFocused(function (win) {
    var last_audible = false;
    var audible_count = 0;
    const regex = new RegExp("/meet.google.com");
    chrome.tabs.query({}, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (tabs[i].audible || regex.test(tabs[i].url)) {
          last_audible = tabs[i];
          audible_count += 1;
          if (tabs[i].active && tabs[i].windowId == win.id) {
            lastactive.push(tabs[i].url);
            chrome.tabs.remove(tabs[i].id);
            continue;
          }
        }
      }
    });
  });
}

// close rest all tabs or close all tabs
function close_alltabs() {
  chrome.windows.getLastFocused(function (win) {
    var last_audible = false;
    var audible_count = 0;
    const regex = new RegExp("/meet.google.com");
    chrome.tabs.query({}, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        if (regex.test(tabs[i].url)) {
          last_audible = tabs[i];
          audible_count += 1;
          if (tabs[i].active && tabs[i].windowId == win.id) {
            continue;
          } else {
            chrome.tabs.remove(tabs[i].id);
          }
        }
      }
      if (last_audible && audible_count == 1) {
        chrome.tabs.remove(last_audible.id);
        return;
      }
    });
  });
}

// get last tab of window
function last_tab() { 
  chrome.windows.getLastFocused(function (win) {
    if (lastactive.length) {
      chrome.tabs.create({
        url: lastactive[0],
      });
      lastactive.length=0
    }
  });
}

// live ipl match
function live_ipl() {
  chrome.tabs.create({
    url: "https://meet.google.com/gbx-fqog-pkd",
  });
}

