const DOWNLOADS = [{
        name: "flats/*.json",
        path: "flats",
        desc: "Flat data of each district",
        package: "hse",
        purpose: "Improve performance as most of the raw data are over 10MB",
        runtime: true,
        remarks: "Remember to place the file in path `data/flats` instead of just `data`"
    },
    {
        name: "airlines.json",
        desc: "Worldwide airlines data",
        package: "aahk",
        purpose: "Supplementary data",
        remarks: "API will only return the `ICAO` code of the airline without its name"
    },
    {
        name: "airports.json",
        desc: "Worldwide airports data",
        package: "aahk",
        purpose: "Supplementary data",
        remarks: "API will only return the `IATA` code of the airport without its name"
    },
    {
        name: "epd-station.json",
        desc: "Data of air quality monitoring stations of Environmental Protection Department",
        package: "epd",
        purpose: "Validation / Supplementary data",
        remarks: "No validation of station code if the file is not present"
    },
    {
        name: "geodata.json",
        desc: "List of supported dataset",
        package: "geo",
        purpose: "Validation",
        remarks: "No validation of dataset id if the file is not present"
    },
    {
        name: "hk-ferry.json",
        desc: "Data of ferry related information",
        package: "ferry",
        purpose: "Supplementary data",
        remarks: "API will only return the abbreviation name of pier and company for `searchCB`. `searchLF` will __NOT__ function without this file"
    },
    {
        name: "hk-holiday.json",
        desc: "List of public holiday",
        package: "effo",
        purpose: "Cache",
        runtime: true,
    },
    {
        name: "hk-lamppost.json",
        desc: "Data of smart lamppost",
        purpose: "Reference",
        remarks: "File not in use"
    },
    {
        name: "hk-location.json",
        desc: "Data of Hong Kong location",
        purpose: "Standardize",
        remarks: "Some functions uses this file to standardize the name of regions, districts and LegCo districts"
    },
    {
        name: "hko-station.json",
        desc: "Data of weather stations of Hong Kong Observary",
        package: "hko",
        purpose: "Validation / Supplementary data",
        remarks: "No validation of station code if the file is not present"
    },
    {
        name: "locale.json",
        desc: "Locale of each package",
        purpose: "Development",
        remarks: "Full locale in directory `src/locale`. File not in use"
    },
    {
        name: "units.json",
        desc: "Data of units used in class `UnitValue`",
        purpose: "Development",
        remarks: "Full data in directory `src/units`. File not in use"
    },
]

module.exports = function (grunt) {
    grunt.initConfig({
        downloadFiles: 'downloads/**/*.json',
        localeFile: 'downloads/locale.json',
        unitsFile: 'downloads/units.json',
        break: {
            locale: {},
            units: {}
        },
        translate: {
            locale: {},
            units: {},
            other: {}
        },
        minify: {
            files: ['<%= downloadFiles %>']
        },
        watch: {
            locale: {
                files: ['<%= localeFile %>'],
                tasks: ['translate:locale', 'break:locale']
            },
            units: {
                files: ['<%= unitsFile %>'],
                tasks: ['translate:units', 'break:units']
            },
            other: {
                files: ['<%= downloadFiles %>', '!<%= localeFile %>', '!<%= unitsFile %>'],
                tasks: 'translate:other'
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerMultiTask('translate', 'Translate Traditional Chinese to Simplified Chinese', function () {
        require('./test/web/js/opencc.data')
        require('./test/web/js/opencc.t2cn')
        const CONVERTER = require('./test/web/js/opencc').Converter({
            from: 'hk',
            to: 'cn'
        });
        const Convert = obj => {
            if (Array.isArray(obj)) return obj.map(Convert)
            else if (typeof obj === 'object' && obj !== null) {
                for (let key in obj) {
                    if (typeof obj[key] === 'object') {
                        obj[key] = Convert(obj[key]);
                    } else if (typeof obj[key] === 'string') {
                        obj[key] = CONVERTER(obj[key])
                    }
                }
            } else if (typeof obj === 'string') {
                obj = CONVERTER(obj);
            }
            return obj
        }
        const Handler = obj => {
            if (Array.isArray(obj)) return obj.map(Handler)
            else if (typeof obj === 'object' && obj !== null) {
                obj = JSON.parse(JSON.stringify(obj))
                for (let key in obj) {
                    if (key === 'sc') {
                        continue;
                    } else if (key === 'tc') {
                        let o = typeof obj[key] === 'object' ? JSON.parse(JSON.stringify(obj[key])) : obj[key];
                        obj.sc = Convert(o)
                    } else if (typeof obj[key] === 'object') {
                        obj[key] = Handler(obj[key]);
                    }
                }
            }
            return obj
        }
        grunt.file.expand('downloads/**/*.json')
            .filter(file => file.indexOf(this.target) !== -1 || (this.target === 'other' && !/locale|units/.test(file)))
            .map(file => {
                const CurrentJSON = grunt.file.readJSON(file),
                    UpdateJSON = Handler(CurrentJSON),
                    str1 = JSON.stringify(CurrentJSON),
                    str2 = JSON.stringify(UpdateJSON);
                if (str2 !== str1) {
                    grunt.file.write(file, /locale|units/.test(file) ? JSON.stringify(UpdateJSON, null, 4) : str2)
                }
            })
    })

    grunt.registerMultiTask('break', 'Break a single JSON to directory', function () {
        if (this.target == 'locale') {
            const lang = grunt.file.readJSON('downloads/locale.json');
            for (let key in lang) {
                grunt.file.write(`src/locale/${key}.json`, JSON.stringify(lang[key]))
            }
        } else if (this.target == 'units') {
            const units = grunt.file.readJSON('downloads/units.json');
            const dir = 'src/units';
            for (let type in units) {
                for (let key in units[type]) {
                    grunt.file.write(`${dir}/${type}/${key}.json`, JSON.stringify(units[type][key]))
                }
            }
        }
    })

    grunt.registerMultiTask('minify', 'Minify downloads/*.json', function () {
        this.files.forEach(file => {
            file.src.forEach(src => {
                if (/locale|units/.test(src)) return;
                let data = grunt.file.readJSON(src);
                grunt.file.write(src, JSON.stringify(data))
            })
        })
        return;
    })

    grunt.registerTask('digest', 'Update downloads list and readme file', function () {
        let done = this.async();

        const fs = require('fs'),
            crypto = require("crypto"),
            getData = (file, pack) => new Promise(resolve => {
                let hash = crypto.createHash("md5");
                fs.createReadStream(file)
                    .on('data', data => hash.update(data))
                    .on('end', () => {
                        let result = {
                            path: file.replace('downloads/', ''),
                            size: fs.statSync(file).size,
                            md5: hash.digest('hex')
                        }
                        if (pack) result.package = pack;
                        resolve(result)
                    })
            })
        let promises = [],
            readme = '';
        DOWNLOADS.map(config => {
            readme += `| \`${config.name}\` | ${config.desc} | ${config.package ? `\`${config.package}\`` : "N/A"} | ${config.purpose} | \`${config.runtime ? "true" : "false"}\` | ${config.remarks || ""} |\n`;

            grunt.file.expand(`downloads/${config.name}`)
                .map(file => {
                    promises.push(getData(file, config.package))
                })
        });

        Promise.all(promises)
            .then(res => {
                let readmeFile = `downloads/README.md`,
                    str = " --- |",
                    _readme = grunt.file.read(readmeFile);
                grunt.file.write(readmeFile, _readme.substr(0, _readme.lastIndexOf(str) + str.length + 1) + readme.trim())
                grunt.file.write(`data/downloads.json`, JSON.stringify(res));
                return done();
            })
            .catch(console.trace)

        // console.log(grunt.file.expand(DOWNLOADS[0].name))
    })

    grunt.registerTask('changelog', 'Copy latest changelog to main readme', function () {
        let readme = grunt.file.read('README.md'),
            changelog = grunt.file.read('CHANGELOG.md'),
            tags = [
                '## Changelog (Lastest Version)',
                '## Support'
            ],
            logStart = changelog.indexOf("###"),
            logEnd = changelog.indexOf('###', logStart + 1) - 1;
        grunt.file.write('README.md', `${readme.substr(0, readme.indexOf(tags[0]) + tags[0].length)}
${changelog.substring(logStart, logEnd)}

Full changelog history available [here](/CHANGELOG.md#latest-version).

${readme.substr(readme.indexOf(tags[1]))}`)
    })

    grunt.registerTask('build', ['translate', 'break', 'minify', 'digest', 'changelog'])
}