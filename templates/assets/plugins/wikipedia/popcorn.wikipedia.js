(function ( Popcorn ) {

  var allWikiLangLinks, allWikiLangNames;

  // shortcut
  function create( type ) {
    return document.createElement( type );
  }

  function getFragment( inputString ) {
    //grabbed from butter util methods
    var range = document.createRange(),
        // For particularly speedy loads, 'body' might not exist yet, so try to use 'head'
        container = document.body || document.head,
        fragment;

    range.selectNode( container );
    fragment = range.createContextualFragment( inputString );

    if( fragment.childNodes.length === 1 ){
      var child = fragment.firstChild;
      fragment.removeChild( child );
      return child;
    }

    return fragment;
  }

  function validateDimension( value, fallback ) {
    if ( typeof value === "number" ) {
      return value;
    }
    return fallback;
  }

  function sanitize( text ) {
    return text.replace( /\(/g, "&lpar;" )
               .replace( /\)/g, "&rpar;" )
               .replace( /-/g, "&hyphen;" )
               .replace( /\s/g, "&nbsp;" )
               .replace( /,/g, "&comma;" )
               .replace( /'/g, "&apos" );
  }

  function areValidElements( element ) {
    while( element && !element.textContent ){
      element = element.nextElementSibling;
      if ( !element || element.nodeName !== "P" ) {
        return false;
      }
    }
    return true;
  }

  var WikipediaDefinition = {

    _setup : function( options ) {
      // declare needed variables
      // get a guid to use for the global wikicallback function
      var _title,
          _titleDiv,
          _titleTextArea,
          _mainContentDiv,
          _contentArea,
          _toWikipedia,
          _inner,
          _outer,
          _href,
          _guid = Popcorn.guid( "wikiCallback" ),
          _this = this;

      options._target = Popcorn.dom.find( options.target );

      if ( !options._target ) {
        return;
      }

      options._container = _outer = create( "div" );
      _outer.classList.add( "wikipedia-outer-container" );

      _outer.style.width = validateDimension( options.width, "100" ) + "%";
      _outer.style.height = validateDimension( options.height, "100" ) + "%";
      _outer.style.top = validateDimension( options.top, "0" ) + "%";
      _outer.style.left = validateDimension( options.left, "0" ) + "%";
      _outer.style.zIndex = +options.zindex;

      _inner = create( "div" );
      _inner.classList.add( "wikipedia-inner-container" );

      _titleDiv = create( "div" );
      _titleDiv.classList.add( "wikipedia-title" );

      _titleTextArea = create( "div" );
      _titleTextArea.classList.add( "wikipedia-title-text" );
      _titleTextArea.classList.add( "wikipedia-ellipsis" );

      _titleDiv.appendChild( _titleTextArea );

      _mainContentDiv = create( "div" );
      _mainContentDiv.classList.add( "wikipedia-main-content" );

      _contentArea = create( "div" );
      _contentArea.classList.add( "wikipedia-content" );

      _mainContentDiv.appendChild( _contentArea );

      _toWikipedia = create( "a" );
      _toWikipedia.classList.add( "wikipedia-to-wiki" );

      _inner.appendChild( _titleDiv );
      _inner.appendChild( _mainContentDiv );
      _inner.appendChild( _toWikipedia );

      _outer.classList.add( options.transition );
      _outer.classList.add( "off" );

      _outer.appendChild( _inner );
      options._target.appendChild( _outer );

      if ( !options.lang ) {
        options.lang = "en";
      }

      window[ _guid ] = function ( data ) {

        if ( data.error ) {
          _titleTextArea.innerHTML = "Article Not Found";
          _contentArea.innerHTML = data.error.info;
          return;
        }

        var childIndex = 1,
            responseFragment = getFragment( "<div>" + data.parse.text + "</div>" ),
            element = responseFragment.querySelector( "div > p:nth-of-type(" + childIndex + ")" ),
            mainText = "";

        _titleTextArea.appendChild( getFragment( "<a href=\"" + options._link + "\" target=\"_blank\">" + sanitize( data.parse.title ) + "</a>" ) );
        _toWikipedia.href = options._link;
        _toWikipedia.onclick = function() {
          _this.media.pause();
        };
        _toWikipedia.setAttribute( "target", "_blank" );

        while ( !areValidElements( element ) ) {
          element = responseFragment.querySelector( "div > p:nth-of-type(" + ( ++childIndex ) + ")" );
        }

        while ( element && element.nodeName === "P" ) {
          mainText += element.textContent + "<br />";
          element = element.nextElementSibling;
        }

        _contentArea.innerHTML = mainText;
      };

      if ( options.src ) {

        _href = "//" + window.escape( options.lang ) + ".wikipedia.org/w/";
        _title = options.src.slice( options.src.lastIndexOf( "/" ) + 1 );
        options._link = "//" + window.escape( options.lang + ".wikipedia.org/wiki/" + _title );

        // gets the mobile format, so that we don't load unwanted images when the respose is turned into a documentFragment
        Popcorn.getScript( _href + "api.php?action=parse&prop=text&redirects&page=" +
          window.escape( _title ) + "&noimages=1&mobileformat=html&format=json&callback=" + _guid );
      }

      options.toString = function() {
        return options.src || options._natives.manifest.options.src[ "default" ];
      };
    },

    start: function( event, options ){
      if ( options._container ) {
        Popcorn.toggleOn( options._container );
      }
    },

    end: function( event, options ){
      if ( options._container ) {
        Popcorn.toggleOff( options._container );
      }
    },

    _teardown: function( options ){
      if ( options._target && options._container ) {
        options._target.removeChild( options._container );
      }
    }
  };

  // Language codes: http://stats.wikimedia.org/EN/TablesDatabaseWikiLinks.htm

  allWikiLangLinks = ( "en,ja,es,de,ru,fr,it,pt,pl,zh,nl,tr,ar,sv,id,cs,fi,ko,th,fa,hu,he,no,vi,uk,da,ro" +
                         ",bg,hr,ca,el,sk,ms,sr,lt,sl,simple,eo,tl,et,hi,kk,sh,nn,ta,az,bs,af,eu,ka,lv,gl" +
                         ",zh_yue,tpi,mk,mr,la,ml,sq,be,cy,br,is,an,bn,war,oc,hy,arz,te,jv,ceb,sw" +
                         ",lb,als,ur,vo,fy,kn,gan,mg,ang,vec,gd,gu,ast,io,uz,qu,wuu,su,ku,yo,ga" +
                         ",tt,scn,bar,nds,se,ht,ne,ia,sco,lmo,mn,cv,ckb,diq,my,pnb,new,pms,zh-min-nan,yi,am" +
                         ",bpy,li,si,os,mt,nah,ps,fo,hsb,ilo,nap,wa,gv,ky,pam,sah,co,tg,ba,bcl" +
                         ",hif,km,sa,vls,or,mzn,ig,so,bo,kl,ksh,as,mi,szl,mwl,nrm,dsb,fiu-vro,dv,stq" +
                         ",tk,roa-rup,bug,mhr,kw,fur,sc,lad,csb,pa,rue,frr,gn,rm,ace,nv,bjn,arc,krc,ext,ug,nov" +
                         ",frp,crh,ab,lij,jbo,kv,ay,ce,ln,pdc,udm,eml,ie,mrj,xal,bh,hak,lo,wo" +
                         ",glk,myv,sn,chr,pag,rw,pcd,pap,zea,lbe,vep,koi,na,haw,cu,to,pi,av,zu,lez,kab,mdf," +
                         "tet,kaa,za,bm,rmy,kbd,iu,bi,kg,pih,ss,chy,ee,om,cr,cdo,srn,got,ha,bxr,ch,ty,sm,ltg," +
                         "pnt,ak,dz,st,sd,ik,ts,nso,y,tn,ki,ff,rn,xh,sg,ve,tw,ks,tum,fj,ti,lg" ).split( "," );

  allWikiLangNames = ( "English,Japanese,Spanish,German,Russian,French,Italian,Portuguese,Polish," +
                           "Chinese,Dutch,Turkish,Arabic,Swedish,Indonesian,Czech,Finnish,Korean,Thai," +
                           "Persian,Hungarian,Hebrew,Norwegian,Vietnamese,Ukrainian,Danish,Romanian," +
                           "Bulgarian,Croatian,Catalan,Greek,Slovak,Malay,Serbian,Lithuanian,Slovene," +
                           "Simple English,Esperanto,Tagalog,Estonian,Hindi,Kazakh,Serbo-Croatian,Nynorsk," +
                           "Tamil,Azeri,Bosnian,Afrikaans,Basque,Georgian,Latvian,Galician,Cantonese," +
                           "Tok Pisin,Macedonian,Marathi,Latin,Malayalam,Albanian,Welsh,Breton," +
                           "Icelandic,Aragonese,Bengali,Waray-Waray,Occitan,Armenian,Egyptian Arabic," +
                           "Belarusian,Telugu,Javanese,Cebuano,Swahili,Luxembourgish,Alemannic,Urdu," +
                           "Volapuk,Frisian,Kannada,Gan,Malagasy,Anglo Saxon,Venetian," +
                           "Scots Gaelic,Gujarati,Asturian,Ido,Uzbek,Quechua,Wu,Sundanese,Kurdish,Yoruba," +
                           "Irish,Tatar,Sicilian,Bavarian,Low Saxon,Northern Sami,Haitian,Nepali," +
                           "Interlingua,Scots,Lombard,Mongolian,Chuvash,Sorani,Zazaki,Burmese,Western Panjabi" +
                           ",Nepal Bhasa,Piedmontese,Min Nan,Yiddish,Amharic,Bishnupriya Manipuri,Limburgish," +
                           "Sinhala,Ossetic,Maltese,Nahuatl,Pashto,Faroese,Upper Sorbian,Ilokano,Neapolitan," +
                           "Walloon,Manx,Kirghiz,Kapampangan,Sakha,Corsican,Tajik,Bashkir," +
                           "Central Bicolano,Fiji Hindi,Khmer,Sanskrit,West Flemish,Oriya,Mazandarani," +
                           "Igbo,Somali,Tibetan,Greenlandic,Ripuarian,Assamese,Maori,Silesian," +
                           "Mirandese,Norman,Lower Sorbian,Voro,Divehi,Saterland Frisian,Turkmen,Aromanian," +
                           "Buginese,Eastern Mari,Cornish,Friulian,Sardinian,Ladino,Cassubian,Punjabi,Rusyn," +
                           "North Frisian,Guarani,Romansh,Acehnese,Navajo,Banjar,Aramaic,Karachay-Balkar," +
                           "Extremaduran,Uyghur,Novial,Arpitan,Crimean Tatar,Abkhazian,Ligurian," +
                           "Lojban,Komi,Aymara,Chechen,Lingala,Pennsylvania German,Udmurt,Emilian-Romagnol," +
                           "Interlingue,Western Mari,Kalmyk,Bihari,Hakka,Laotian,Wolof,Gilaki," +
                           "Erzya,Shona,Cherokee,Pangasinan,Kinyarwanda,Picard,Papiamentu,Zealandic,Lak," +
                           "Vepsian,Komi Permyak,Nauruan,Hawai'ian,Old Church Slavonic,Tongan,Pali,Avar," +
                           "Zulu,Lezgian,Kabyle,Moksha,Tetum,Karakalpak,Zhuang,Bambara,Romani,Karbadian," +
                           "Inuktitut,Bislama,Kongo,Norfolk,Siswati,Cheyenne,Ewe,Oromo,Cree,Min Dong," +
                           "Sranan,Gothic,Hausa,Buryat,Chamorro,Tahitian,Samoan,Latgalian,Pontic,Akan," +
                           "Dzongkha,Sesotho,Sindhi,Inupiak,Tsonga,Northern Sotho,Chichewa,Setswana,Kikuyu," +
                           "Fulfulde,Kirundi,Xhosa,Sangro,Venda,Twi,Kashmiri,Tumbuka,Fijian,Tigrinya,Ganda" ).split( "," );

  Popcorn.plugin( "wikipedia", WikipediaDefinition, {
    about:{
      name: "Popcorn Wikipedia Plugin",
      version: "0.1",
      author: "@ChrisDeCairos",
      website: "https://chrisdecairos.ca/"
    },
    options:{
      start: {
        elem: "input",
        type: "number",
        label: "Start",
        "units": "seconds"
      },
      end: {
        elem: "input",
        type: "number",
        label: "End",
        "units": "seconds"
      },
      lang: {
        elem: "select",
        options: allWikiLangNames,
        values: allWikiLangLinks,
        label: "Language",
        "default": "en"
      },
      src: {
        elem: "input",
        type: "text",
        label: "Article Link/Title",
        "default": "Popcorn.js"
      },
      width: {
        elem: "input",
        type: "number",
        label: "Width",
        "default": 40,
        "units": "%",
        "hidden": true
      },
      height: {
        elem: "input",
        type: "number",
        label: "Height",
        "default": 50,
        "units": "%",
        "hidden": true
      },
      top: {
        elem: "input",
        type: "number",
        label: "Top",
        "default": 25,
        "units": "%",
        "hidden": true
      },
      left: {
        elem: "input",
        type: "number",
        label: "Left",
        "default": 30,
        "units": "%",
        "hidden": true
      },
      target: {
        hidden: true
      },
      transition: {
        elem: "select",
        options: [ "None", "Pop", "Fade", "Slide Up", "Slide Down" ],
        values: [ "popcorn-none", "popcorn-pop", "popcorn-fade", "popcorn-slide-up", "popcorn-slide-down" ],
        label: "Transition",
        "default": "popcorn-fade"
      },
      zindex: {
        hidden: true
      }
    }
  });

}( Popcorn ));
