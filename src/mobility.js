// Public exploration only: collision surfaces and chapter boundaries still apply.
export const mobilityIslands = new Set(['tabernacle','solomon','second-temple','herod','exodus','jordan','jerusalem','paul','abraham','joseph','sinai','judges','david','kingdoms','exile','nehemiah','intertestament','nativity','galilee','samaria','parables','passion','church','letters']);
export const mobilityFor = id => mobilityIslands.has(id);
export const movementSettings = Object.freeze({walkSpeed:2.2,runSpeed:4.5,acceleration:9,deceleration:14});
