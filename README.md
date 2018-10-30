# enmdb
Eros Nicolau Movies Database

# Movie listings challenge

## Installation instructions

* CLone the repository locally
* Install Bootstrap:
* $ npm install bootstrap
* Open index.html in a browser

## Note on REACT:

* I found this exact challenge as a public REACT-REDUX tutorial online. So I chose vanilla JS instead (with bits of jQuery in between)

## Extras included:

* The possibility to switch between showing All the possible filters and showing only the filters Relevant to the current page
* Paging

## Things that could be done to improve the demo:

* Adding a movies details modal / page
* Adding a "loading" spinner
* Refining the init() action so as to only refresh the changed bits of the page (REACT style)
* Drop jQuery alltogether
* Eliminate all traces of before ES6 code (like using classic functions instead of fat arrow functions)
* Maybe treating Movies as instances of a Movie class / object

## Issues encountered:

The request stated: "Movies should be filterable by multiple genres, the user should have the ability to toggle movies depending on all of its assigned genres. For example if 'Action' and 'Drama' genres are selected listed movies must have both 'Action' and 'Drama' genres.". So I applied an AND filter, not an OR one. I hope I understood the request correctly.
