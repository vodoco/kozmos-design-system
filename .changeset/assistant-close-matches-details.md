---
"@kozmos-ds/react": patch
---

AICompanionPanel's close button is the details card's close (decision 73, GAP-145): an outline, neutral `IconButton`, 44px square with a 20px X, as POIDetailPanel draws it. It was a 36px bordered pill with a 44px target drawn round it, so the assistant's header is 8px taller.
