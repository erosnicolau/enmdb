
// Set the API variables:
const api_key   = '9935ad097e51c91b1304f36f02c76d66',
api_base  = 'https://api.themoviedb.org/3/';

// Initiate the page app
const init = async () => {

  // For refresh / page change purposes, first empty the #app
  $('#app').empty();

  // Hook into the #app div and pre-populate with the needed scaffolding DOM
  $('#app').append(`
    <div class="row">
      <div class="col-10" id="movies">
        <h2 class="border-bottom">Movies:</h2>
        <div class="pagingContainer row"></div>
        <div class="moviesContainer row"></div>
      </div>
      <div class="col-2">
        <h2 class="border-bottom">Rating:</h2>
        <form id="ratings">
          <div class="form-group"></div>
        </form>
        <h2 class="border-bottom">Genres:</h2>
        <form id="genres">
          <div class="form-group"></div>
        </form>
      </div>
    </div>
  `);

  // Check the Local Storage for a base_url.
  // Only if not found, asynchronously call the Config API to get it and set it in the Local Storage
  if( !localStorage.getItem( 'base_url' ) ) {
    let response = await fetch(apiString( 'configuration' ));
    let data = await response.json();
    localStorage.setItem( 'base_url', data.images.base_url );
  }
  // And then,

  // Check the Local Storage for a "genres" JSON string.
  // Only if not found, asynchronously call the Movie List API to get the complete list of genres and set it in the Local Storage
  if( !localStorage.getItem( 'genres' ) ) {
    let response = await fetch(apiString( 'getGenres' ));
    let data = await response.json();
    localStorage.setItem( 'genres', JSON.stringify(data) );
  }
  const genres = JSON.parse(localStorage.getItem('genres')).genres;
  // And then,

  // Set the current page
  // Check the localStorage and set the current page to the value found there
  let urlPage = window.location.search.split("=")[1],
      storedPage = localStorage.getItem( 'currentPage' );
  let currentPage = urlPage ? urlPage : ( storedPage ) ? storedPage : 1;
  // Also, if the page is loaded fresh without any parameters
  // AND a localStorage value for the current page is found,
  // AND that stored value is not referring to the first page,
  // THEN rewrite the history state to reflect the current page
  if(storedPage && ( storedPage != 1 ) ) history.replaceState(null,null, window.location.pathname + "?page=" + storedPage);

  // Get the Now Playing list of movies, asynchronously
  let response = await fetch( apiString( 'nowPlaying', currentPage ) );
  let movies = await response.json();
  // And then,

  // Populate the Paging widget and the Movies, Ratings and Genres lists, all based on the current page data...
  displayPaging(movies.total_pages, currentPage, '#movies .pagingContainer', max = 19);
  displayMovies( movies, genres, '#movies .moviesContainer' );

  displayOptions("ratings", "#ratings .form-group");
  displayRatingsList( movies, '#ratings .form-group' );

  displayOptions("genres", "#genres .form-group");
  displayGenresList( movies, genres, '#genres .form-group' );

  // ...and pre-apply the filters based on existing localStorage data, for good measure
  filterByRating();
  filterByGenre();
}

// Update the navigation based on clicks on the Back / Forward browser buttons
window.onpopstate = (element) => {
  let url = element.target.location.search;
  let page = ( url ) ? url.split( "=" )[ 1 ] : 1;
  localStorage.setItem("currentPage", page);
  init();
}

// Build the dynamic AJAX settings object
const settings = (action, page) => {
  return {
    "async": true,
    "crossDomain": true,
    "url": apiString(action, page),
    "method": "GET",
    "headers": {},
    "data": "{}"
  }
}

// Build the dynamic API string needed in the AJAX settings object
const apiString = (action, page) => {
  let url = false;
  switch (action) {
    case 'nowPlaying':
      url = api_base + "movie/now_playing?page=" + page + "&language=en-US&api_key=" + api_key;
      break;
    case 'getGenres':
      url = api_base + "genre/movie/list?language=en-US&api_key=" + api_key;
      break
    case 'configuration':
      url = api_base + "configuration?api_key=" + api_key;
      break;
    default:
      break;
  }
  return url;
}

const displayMovies = (movies, genres, target) => {
  const moviesList = movies.results.sort((a,b) => (a.popularity < b.popularity) ? 1 : ((b.popularity < a.popularity) ? -1 : 0));
  moviesList.map(movie => { displayMovie(movie, genres, target) });
}

// Generate the code for displaying an individual movie
const displayMovie = (movie, genres, target) => {
  let poster_url = `${localStorage.getItem('base_url')}w342/${movie.poster_path}`;
  let dom = `
    <div class="movie col-3" data-rating="${movie.vote_average}" data-genres="${movie.genre_ids}">
      <div class="card">
        <div class="card-img-top">
          <img src="${poster_url}" alt="${movie.title}" />
        </div>
        <div class="card-body">
          <h4 class="card-title">${movie.title}</h4>
          <div class="text-muted">Popularity: ${movie.popularity}</div>
          <div class="text-muted">Rating: ${movie.vote_average}</div>
          <div class="movieGenres">${getMovieGenres(movie.genre_ids, genres)}</div>
        </div>
      </div>
    </div>
  `;
  $( target ).append( dom );
}

// Generate the list of genres specific to a given movie
const getMovieGenres = ( ids, genres ) => {
  let dom = '<ul class="list-unstyled">';
  const g = ids.map(id => {
    let name = genres.filter( genre => genre.id == id )[0].name;
    //dom += `<li><a href="${id}">${name}</a></li>`;
    // The linked version above would be used in a more complex app, where you'd also have Genre specific pages.
    dom += `<li>${name}</li>`;
  });
  dom += `</ul>`;
  return dom;
}

// Filter in only the genres found on the current page's movies list
const displayGenresList = ( movies, genres, target ) => {
  if( !localStorage.getItem( 'genresOption' ) ) {
    localStorage.setItem( 'genresOption', "relevant" );
  }
  let option = localStorage.getItem( 'genresOption' );
  let currentIds = [];
  movies.results.map(movie => { currentIds.push(...movie.genre_ids) }); // Collect all IDs
  let filteredIds = [...new Set(currentIds)]; // Filter out the duplicate IDs, leaving only unique ones
  const filteredGenres = filteredIds
    .map( id => { return {id, name: genres.filter( genre => genre.id == id )[0].name} } ) // Build back an objects array of the filtered genres with corresponding IDs
    .sort( ( a, b ) => ( a.name > b.name ) ? 1 : ( ( b.name > a.name ) ? -1 : 0 ) ); // Sort the new list in place, by genre name

  switch (option) {
    case "all":
      genres.map(genre => displayGenre( genre, target ) );
      break;
    case "relevant":
      filteredGenres.map(genre => displayGenre( genre, target ) );
      break;
    default:
      filteredGenres.map(genre => displayGenre( genre, target ) );
      break;
  }

}

// Generate the code for displaying an individual movie genre
const displayGenre = ( genre, target ) => {
  let dom = `
    <div class="form-check">
      <label>
        <input type="checkbox" class="genre" data-type="genre" id="${genre.id}" onchange="filterBy(this.dataset.type)" />${genre.name}
      </label>
    </div>
  `;
  $( target ).append( dom );
}

// Filter out and display only the ratings found on the current page's movies list
const displayRatingsList = ( movies, target ) => {

  // First check to see if there's a preference already set for showing all or just the relevant rating filter options
  if( !localStorage.getItem( 'ratingsOption' ) ) {
    localStorage.setItem( 'ratingsOption', "relevant" );
  }
  // Then read the current option
  let option = localStorage.getItem( 'ratingsOption' );

  let currentRatings = [], // Prepare an empty array for showing only the ratings present in the current movie set
      allRatings = [];     // Include an option to display all rating filters, irrespective of the movies in the current movie set
  movies.results.map(movie => { currentRatings.push(Math.round(movie.vote_average*2)/2 ) }); // Collect all Ratings
  let filteredRatings = [...new Set(currentRatings)]; // Filter out the duplicate Ratings, leaving only unique ones
  const filteredGenresList = filteredRatings
    .sort( ( a, b ) => ( a > b ) ? 1 : ( ( b > a ) ? -1 : 0 ) ); // Sort the new list in place, by genre name
  // First, always pre-pend a "Show All" option, with a value of Zero
  $( target ).append(`
    <div class="form-check">
      <label>
        <input type="radio" class="rating" data-type="rating" name="rating" id="0" onchange="filterBy(this.dataset.type)" checked />Show All</strong>
      </label>
    </div>
  `);
  for(let r = .5; r <= 10; r += .5){
    allRatings.push(r);
  }

  switch(option){
    case "all":
      allRatings.map(rating => displayRating( rating, target ) );
      break;
    default:
      filteredGenresList.map(rating => displayRating( rating, target ) );
      break;
  }

}

// Generate the code for displaying an individual rating control
const displayRating = ( rating, target ) => {
  if (rating != 0) { // Don't include the Zero option, as the "Show All" covers that
    let dom = `
    <div class="form-check">
      <label>
        <input type="radio" class="rating" data-type="rating" name="rating" id="${rating}" onchange="filterBy(this.dataset.type)" />At least <strong>${rating}</strong>
      </label>
    </div>
    `;
    $( target ).append( dom );
  }
}

const filterBy = filter => {
  let Ids = [];
  $("."+filter).each(function() {
    $(this).is(':checked') && Ids.push(this.id);
	});
  localStorage.setItem( filter, Ids );
  filterByRating();
  filterByGenre();
}

const filterByRating = () => {

  //Read the localStorage...
  const rating = localStorage.getItem("rating");

  // ...pre-set the radio buttons to the existing logalStorage state
  if(rating && rating.length != 0){
    $('input[data-type=rating]').each( (index, el) => {
      el.checked = (el.id == rating);
    });
  }

  // ...and apply the corresponding filtering
  $('.movie').each( (index, movie) => {
    let that = $(movie)[0];
    if(that.dataset.rating < rating) {
      that.classList.add("hidden");
    } else {
      that.classList.remove("hidden");
    }
  })

}

const filterByGenre = () => {

  //Read the localStorage...
  let filterGenres = localStorage.getItem("genre");
  if(filterGenres){

    // ...pre-set the checkboxes to the existing logalStorage state
    $('input[data-type=genre]').each( (index, el) => {
      el.checked = (filterGenres.indexOf(el.id) != -1);
    });

    // ...and apply the corresponding filtering
    filterGenres = filterGenres.split(",");
    $('.movie:not(.hidden)').each( (index, movie) => {
      let that = $(movie)[0];
      let movieGenres = that.dataset.genres.split(",");
      filterGenres.map(id => {
        if (movieGenres.indexOf(id) == -1) {
          that.classList.add("hidden");
        }
      })
    })
  }

}

// Display the Paging widget
const displayPaging = (totalPages, currentPage = 1, target, max) => {
  let first = (currentPage == 1) ? `<li>First</li>` : `<li><a href="?page=1">First</a></li>`,
      last = (currentPage == totalPages) ? `<li>last</li>` : `<li><a href="?page=${totalPages}">Last</a></li>`,
      dom = `<ul class="paging">`;
  dom += first;
  dom += getPagingRange(currentPage, totalPages, max);
  dom += last;
  dom += `</ul>`;
  $( target ).append( dom );
  $(target + " a").click( element => changePage(element) );
}

// Handle the page change
const changePage = element => {
  element.preventDefault();
  let url = element.target.href,
      page = url.split( "=" )[ 1 ];
  window.history.pushState( {}, "", url );
  localStorage.setItem( "currentPage", page);
  localStorage.setItem("rating", ""); // The page changes, so the rating filters need to be rebuilt from scratch, ignoring the localStorage...
  localStorage.setItem("genre", ""); // ... and so do the genre filters
  init();
};

// Build the range of paging links based on the current page, the total number of pages and the maximum number of paging links to be displayed at a civen time
const getPagingRange = (current, total, length) => {
  if (length > total) length = total;
  let start = current - Math.floor(length / 2);
  start = Math.max(start, 1); // Check that the starting page number is never smaller than the first one
  start = Math.min(start, 1 + total - length); // and never bigger than the total number of pages
  return Array.from({length: length}, (el, i) => (start + i == current) ? `<li>${start + i}</li>` : `<li><a href="?page=${start + i}">${start + i}</a></li>` ).join("");
}

// Set the options related to showing all the filters or just the ones relevant to the current page
const displayOptions = (name, target) => {
  let dom = ``,
      option = (localStorage.getItem(name + "Option"));
  dom += `
    <div class="form-check">
      <label><input type="radio" name="${name}" id="relevant" value="relevant" ${(option == "relevant" || option == undefined)? "checked" : ""}> Relevant</label>
    </div>
    <div class="form-check border-bottom mb-3">
      <label><input type="radio" name="${name}" id="all"      value="all"      ${(option == "relevant" || option == undefined)? "" : "checked"}> All</label>
    </div>
  `;
  $( target ).append( dom );
  setOption(name);
}

// Attach an onclick event to the Options radio buttons, to handle the user input
const setOption = ( group ) => {
  let radios = $("[name=" + group + "]");
  radios.each( (index, radio) => {
    radio.onclick = function(){
      localStorage.setItem(group + "Option", this.value);
      init();
    }
  })
};

$(document).ready( init() );
