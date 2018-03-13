// create local scope 
(function() {
    "use strict";

    var app = {
        init: function(){
            api.getData();
        }
    }

    var api = {
        getData: function() {
            var sparqlquery = `PREFIX dc: <http://purl.org/dc/elements/1.1/>
            PREFIX dct: <http://purl.org/dc/terms/>
            PREFIX sem: <http://semanticweb.cs.vu.nl/2009/11/sem/>
            PREFIX foaf: <http://xmlns.com/foaf/0.1/>
            PREFIX void: <http://rdfs.org/ns/void#>
            SELECT ?cho ?year ?img ?title ?description ?creator WHERE {
                ?cho dc:description ?description .
                ?cho dc:title ?title .
                ?cho sem:hasBeginTimeStamp ?start .
                ?cho foaf:depiction ?img .
                BIND (year(xsd:dateTime(?start)) AS ?year) .
                ?cho void:inDataset <https://data.adamlink.nl/saa/beeldbank/> .
                ?cho dct:provenance "Collectie Stadsarchief Amsterdam: documentaire foto-opdrachten"^^xsd:string .
                OPTIONAL { ?cho dc:creator ?creator }
            }`
            // use encodeURI with the prefixes and settings for the dataset and store in variable
            // store the url with the encoded query as queryURL
            var encodedquery = encodeURIComponent(sparqlquery);
            var queryurl = 'https://api.data.adamlink.nl/datasets/AdamNet/all/services/endpoint/sparql?default-graph-uri=&query=' + encodedquery + '&format=application%2Fsparql-results%2Bjson&timeout=0&debug=on';
            api.fetchData(queryurl);
        },
        fetchData: function(queryurl){
            // transform data to json file using a promise
            fetch(queryurl)
            .then((resp) => resp.json()) 
            .then(function(data) {
                var data = data.results.bindings; // get the results
                var filteredData = data.filter(collection.filterYear);
                var yearlyData = data.filter(collection.filterYear);
                var resultArray = collection.groupBy(yearlyData, function(item)
                {
                  return [item.creator.value];
                });
                template.section(resultArray);
                slider.selectYear(data);
            })
            .catch(function(error) {
                // if there is any error you will catch them here
                console.log(error);
            });
        }
    }

    var slider = {
        activeYear: 1960,
        selectYear: function(data) {
            var sliderInput = document.getElementById("year");
            var result = document.getElementById("result");

            sliderInput.addEventListener("input", sliderResult);
            
            function sliderResult() {
                var integerValue = parseInt(sliderInput.value);
                var totalResult = integerValue + "-" + (integerValue + 9)
                result.innerHTML = integerValue;
                slider.activeYear =  sliderInput.value;
                var yearlyData = data.filter(collection.filterYear);
                var resultArray = collection.groupBy(yearlyData, function(item)
                {
                  return [item.creator.value];
                });

                template.section(resultArray);
                // var result = collection.groupBy(list, function(item) {
                //     console.log(item.creator)
                // })
            }
         
        }
    }

    var collection = {
        groupBy: function(yearlyData, f) {
            var groups = {};
            yearlyData.forEach(function (o) {
                var group = f(o);
                groups[group] = groups[group] || [];
                groups[group].push( o ); 
            });
            return Object.keys(groups).map(function(group) {
                return groups[group]; 
            })
        },
        filterYear: function(item) {
            if (item.year.value == slider.activeYear) {
                return true;
            }
            return false;
        },
        filterSerie: function (item) {
            var serieObj = item.description.value;
            var findSerie = /uit de serie '(.*?)'/g;
            var serie = findSerie.exec(serieObj);
            if (!serie) {
                return;
            } else {
                console.log(1, serie[1])
                return serie[0]
            }
        }
    }

    var template = {
        section: function(resultArray) {
            var objects = [];
            resultArray.forEach(function (items) {
                var serieValue = items.map(collection.filterSerie)
                console.log(items, serieValue)
                // var container = document.getElementById("container");
                // var ul = document.createElement("ul");
                // container.appendChild(ul);

                // for (var i = 0; i < items.length; ++i) {
                //     console.log(items[i])
                // }


                // console.log(items)
                // Transparency.render(document.getElementById('container'), items)
                items.forEach(function(obj, i) {
                    objects.push({
                        image: obj.img.value,
                        description: obj.description.value,
                        title: obj.title.value,
                        source: obj.cho.value,
                        serie: serieValue[i],
                        creator: obj.creator.value
                    })
                })

                // items.forEach(function(objects) {
                //     var creator = objects.creator.value;
                //     var currentCreator = creator[0];
                //     var section = document.getElementById("section");
                //     var container = document.createElement("div")
                    
                //     section.appendChild(container);
                //     console.log(creator)
                // })
            });


            var directive = {
                image: {
                    src: function(){
                        return this.image
                    }
                },
                source: {
                    href: function() {
                        console.log(this.source)
                        return this.source
                    }
                }
            }

            // var elem = document.querySelector('#section');
            // var msnry = new Masonry( elem, {
            // // options
            // itemSelector: '.container',
            // columnWidth: 20,
            // horizontalOrder: true,
            // gutter: 20
            // });

            // // element argument can be a selector string
            // //   for an individual element
            // var msnry = new Masonry( '.grid', {
            // // options
            // });

            Transparency.render(document.getElementById('section'), objects, directive)
            var loader = document.querySelectorAll('#loader');
            loader.forEach(function(i){
                i.classList.add("hidden")
            })

            // var elem = document.querySelector('.grid');
            // var msnry = new Masonry( elem, {
            // // options
            // itemSelector: '.grid-item',
            // columnWidth: 20,
            // horizontalOrder: true
            // });

            // // element argument can be a selector string
            // //   for an individual element
            // var msnry = new Masonry( '.grid', {
            // // options
            // });

            // var serie = collection.series(resultArray);
        }

    };

    app. init();
})();