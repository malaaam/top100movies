
// Create array of links
var links = [];
var nodes = [];

// Load movies data
d3.tsv('data/movies.tsv', function(error, data) {
    if(error) throw error;
    d3.tsv('data/metadata.tsv', function(error, metadata) {
        if(error) throw error;

        var numberOfFilms = data.length;
        console.log(data.length + ' ' + metadata.length);

        // Create the similarity matrix
        var similarity = new Array(numberOfFilms);
        for (var i = 0; i < numberOfFilms; i++) {
            similarity[i] = new Array(numberOfFilms);
        }

        // compute some statistic while loading
        data.forEach(function(d) {
            var score = 0;
            var critics = [];
            var index = data.indexOf(d);
            for(var i=0; i<177; i++) {
                critic = 'c'+d3.format('03')(i+1);
                rank = d[critic];
                if(rank > 0) {
                    score += 11 - rank;
                    critics.push(critic);
                } else {
                    delete d[critic];
                }
            }
            d.score = score;
            d.critics = critics;
            var elem = metadata[index];
            d.poster = elem['Poster'];
        });

        data = data.filter(function(d) { return d.score > 20; });
        numberOfFilms = data.length;

        var totalScore = 0;

        // compute the similarity matrix
        for (var i = 0; i < numberOfFilms; i++) {
            similarity[i][i] = 1;
            nodes.push({'id': data[i].title, 'score': data[i].score})
            totalScore += data[i].score;
            for (var j = i+1; j < numberOfFilms; j++) {
                list1 = data[i]['critics'];
                list2 = data[j]['critics'];
                commonCritics = 0;
                for (var x = 0, y = 0; x < list1.length && y < list2.length;) {
                    if (list1[x] > list2[y]) {
                        y++;
                    } else if (list1[x] < list2[y]) {
                        x++;
                    } else {
                        x++;
                        y++;
                        commonCritics++;
                    }
                }
                similarity[i][j] = commonCritics / Math.max(list1.length, list2.length);
                similarity[j][i] = similarity[i][j];
                if (similarity[i][j] != 0) {
                    links.push({'source': data[i].title, 'target': data[j].title, 'value': similarity[i][j]});
                } /*else {
                    links.push({'source': data[i].title, 'target': data[j].title, 'value': 0.01});
                }*/
            }
        }

        var svg = d3.select('svg'),
        width = svg.attr('width'),
        height = svg.attr('height');

        //var scores = data.map((d) => { return d.score; });

        var totalArea = width*height/2.6;
        var covered = [];

        data.forEach((d) => {

            var movieArea = Math.floor(totalArea * d.score / totalScore);
            var movieWidth = Math.round(6 * Math.sqrt(movieArea / 54));
            var movieHeight =  Math.round(9 * Math.sqrt(movieArea / 54));

            var randomX, randomY, findAPlace;

            do {
                randomX = Math.floor(Math.random() * width);
                randomY = Math.floor(Math.random() * height);

                // Check and correct x and y for box boundaries
                if (randomX + movieWidth >= width) {
                    randomX -= width - randomX + movieWidth + 1;
                }
                if (randomX <= 0) {
                    randomX = 1;
                }
                if (randomY + movieHeight >= height) {
                    randomY -= height - randomY + movieHeight + 1;
                }
                if (randomY <= 0) {
                    randomY = 1;
                }

                findAPlace = true;

                // Check x and y for overlapping
                for (var i = 0; i < covered.length; i++) {
                    var x = covered[i]['x'];
                    var y = covered[i]['y'];
                    var w = covered[i]['w'];
                    var h = covered[i]['h'];
                    if (randomX < x && randomX + movieWidth >= x) {
                        if (randomY < y && randomY + movieHeight >= y) {
                            findAPlace = false;
                            break;
                        }
                        if (randomY >= y && randomY <= y + h && randomY + movieHeight >= y) {
                            findAPlace = false;
                            break;
                        }
                    }
                    if (randomX >= x && randomX <= x + w && randomX + movieWidth >= x) {
                        if (randomY < y && randomY + movieHeight >= y) {
                            findAPlace = false;
                            break;
                        }
                        if (randomY >= y && randomY <= y + h && randomY + movieHeight >= y) {
                            findAPlace = false;
                            break;
                        }
                    }
                }
            } while (!findAPlace);

            covered.push({'x': randomX, 'y': randomY, 'w': movieWidth, 'h': movieHeight});

            svg.select('g')
                .append('defs')
                .append('pattern')
                .attr('id', d.id)
                .attr('patternUnits', 'userSpaceOnUse')
                .attr('x', randomX)
                .attr('y', randomY)
                .attr('width', movieWidth)
                .attr('height', movieHeight)
                .append('image')
                .attr('xlink:href', d.poster)
                .attr('width', movieWidth)
                .attr('height', movieHeight);

            var movie = svg.select('g')
                .append('rect')
                .attr('x', randomX)
                .attr('y', randomY)
                .attr('width', movieWidth)
                .attr('height', movieHeight)
                .attr('fill', 'url(#' + d.id + ')')
                .attr('class', 'movie');
        });

        svg.append('rect')
            .attr('class', 'zoom-layer')
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .attr('width', width)
            .attr('height', height);

        var zoom = d3.zoom()
            .scaleExtent([1, 15])
            .on('zoom', function () {
                d3.select('svg')
                    .select('g')
                    .attr('transform', 'translate(' + d3.event.transform.x + ',' + d3.event.transform.y + ') scale(' + d3.event.transform.k + ')');
            });

        var zoomrect = d3.select('svg').select('.zoom-layer').call(zoom);
        console.log('covered lenght: ' + covered.length);
    });

    /*var link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter().append('line');

    var node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        //.attr('r', function(n) { return n.score; })
        .attr('r', 5)
        .attr('fill', 'black')
        //.call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended))
        ;

    body.selectAll('.movie')
        .data(data
            .filter(function(d) { return d.score > 20; })
            .sort(function(a, b) { return b.score - a.score; })
        )
        .enter().append('div')
            .text(function(d) { return d.title; });*/
});
