"use strict";

(function ( Popcorn ) {

  var allWikiLangLinks = ( "en,ja,es,de,ru,fr,it,pt,pl,zh,nl,tr,ar,sv,id,cs,fi,ko,th,fa,hu,he,no,vi,uk,da,ro" + 
                         ",bg,hr,ca,el,sk,ms,sr,lt,sl,simple,eo,tl,et,hi,kk,sh,nn,ta,az,bs,af,eu,ka,lv,gl" +
                         ",tpi,mk,mr,la,ml,sq,be,cy,br,is,an,bn,war,oc,hy,arz,te,jv,ceb,sw" +
                         ",lb,als,ur,vo,fy,kn,gan,mg,ang,vec,gd,gu,ast,io,uz,qu,wuu,su,ku,yo,ga" +
                         ",tt,scn,bar,nds,se,ht,ne,ia,sco,lmo,mn,cv,ckb,diq,my,pnb,new,pms,zh-min-nan,yi,am" +
                         ",bpy,li,si,os,mt,nah,ps,fo,hsb,ilo,nap,wa,gv,ky,pam,sah,co,tg,ba,bcl" +
                         ",hif,km,sa,vls,or,mzn,ig,so,bo,kl,ksh,as,mi,szl,mwl,nrm,dsb,fiu-vro,dv,stq" +
                         ",tk,roa-rup,bug,mhr,kw,fur,sc,lad,csb,pa,rue,frr,gn,rm,ace,nv,bjn,arc,krc,ext,ug,nov" +
                         ",frp,crh,ab,lij,jbo,kv,ay,ce,ln,pdc,udm,eml,ie,mrj,xal,bh,hak,lo,wo" +
                         ",glk,myv,sn,chr,pag,rw,pcd,pap,zea,lbe,vep,koi,na,haw,cu,to,pi,av,zu,lez,kab,mdf," +
                         "tet,kaa,za,bm,rmy,kbd,iu,bi,kg,pih,ss,chy,ee,om,cr,cdo,srn,got,ha,bxr,ch,ty,sm,ltg," +
                         "pnt,ak,dz,st,sd,ik,ts,nso,y,tn,ki,ff,rn,xh,sg,ve,tw,ks,tum,fj,ti,lg" ).split( "," );

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
  };

  Popcorn.plugin( "wikipedia" , {

    _setup : function( options ) {
      // declare needed variables
      // get a guid to use for the global wikicallback function
      var _text,
          _title,
          _titleDiv,
          _titleTextArea,
          _mainContentDiv,
          _contentArea,
          _toWikipedia,
          _container,
          _href,
          _guid = Popcorn.guid(),
          _manifestOpts = options._natives.manifest.options;

      options._target = Popcorn.dom.find( options.target ) || Popcorn.dom.find( _manifestOpts.target[ "default" ] );

      if ( !options._target ) {
        return;
      }

      options._container = _container = create( "div" );

      _container.classList.add( "wikipedia-inner-container" );
      _container.style.width = ( options.width || _manifestOpts.width[ "default" ] ) + "%";
      _container.style.height = ( options.height || _manifestOpts.height[ "default" ] ) + "%";
      _container.style.top = ( options.top || _manifestOpts.top[ "default" ] ) + "%";
      _container.style.left = ( options.left || _manifestOpts.left[ "default" ] ) + "%";

      _titleDiv = create( "div" );
      _titleDiv.classList.add( "wikipedia-title");

      _titleTextArea = create( "div" );
      _titleTextArea.classList.add( "wikipedia-title-text" );
      _titleTextArea.classList.add( "wikipedia-ellipsis" );

      _titleDiv.appendChild( _titleTextArea );

      _mainContentDiv = create( "div" );
      _mainContentDiv.classList.add( "wikipedia-main-content" );

      _contentArea = create( "div" );
      _contentArea.classList.add( "wikipedia-content" );

      _mainContentDiv.appendChild( _contentArea );

      _toWikipedia = create( "div" );
      _toWikipedia.classList.add( "wikipedia-to-wiki" );

      _container.appendChild( _titleDiv );
      _container.appendChild( _mainContentDiv );
      _container.appendChild( _toWikipedia );

      options._target.appendChild( _container );

      if ( !options.lang ) {
        options.lang = "en";
      }

      window[ "wikiCallback" + _guid ]  = function ( data ) {

        if ( data.error ) {
          _titleTextArea.innerHTML = "Uh oh....";
          _contentArea.innerHTML = data.error.info;
          return;
        }

        var responseFragment = getFragment( "<div>" + data.parse.text + "</div>" ),
            element = responseFragment.querySelector( "div > p:nth-of-type(1)" ),
            mainText = "",
            toWikiLink,
            link,
            fragNodeName;

        _titleTextArea.appendChild( getFragment( "<a href=\"" + options._link + "\" target=\"_blank\">" + data.parse.title + "</a>" ) );
        _toWikipedia.appendChild( getFragment( "<div>Read more on <a href=\"" + options._link + "\" target=\"_blank\">Wikipedia</a></div>" ) );

        // Store the Main text of the article, will leave "element" on first header element
        while ( element && element.nodeName === "P" ) {
          mainText += element.textContent + "<br />";
          element = element.nextElementSibling;
        }

        _contentArea.innerHTML = mainText;

      };

      if ( options.src ) {

        _href = "//" + options.lang + ".wikipedia.org/w/";
        _title = options.src.slice( options.src.lastIndexOf( "/" ) + 1 );
        options._link = "//" + options.lang + ".wikipedia.org/wiki/" + _title;

        // gets the mobile format, so that we don't load unwanted images when the respose is turned into a documentFragment
        Popcorn.getScript( _href + "api.php?action=parse&prop=text&redirects&page=" +
          _title + "&noimages=1&mobileformat=html&format=json&callback=wikiCallback" + _guid );
      }

      options.toString = function() {
        return options.src || options._natives.manifest.options.src[ "default" ];
      };
    },

    start: function( event, options ){
      if ( options._container ) {
        options._container.classList.add( "wikipedia-visible" );
      }
    },

    end: function( event, options ){

      if ( options._container ) {
        options._container.classList.remove( "wikipedia-visible" );
      }
    },

    _teardown: function( options ){

      if ( options._target && options._container ) {
        options._target.removeChild( options._container );
      }
    },

    manifest: {
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
          label: "Start"
        },
        end: {
          elem: "input",
          type: "number",
          label: "End"
        },
        lang: {
          elem: "select",
          options: allWikiLangLinks,
          label: "Language",
          "default": "en"
        },
        src: {
          elem: "input", 
          type: "text", 
          label: "Article Link/Title",
          "default": "London_2012_Olympics"
        },
        width: {
          elem: "input",
          type: "number",
          label: "Width",
          "default": 40,
          "units": "%"
        },
        height: {
          elem: "input",
          type: "number",
          label: "Height",
          "default": 50,
          "units": "%"
        },
        top: {
          elem: "input",
          type: "number",
          label: "Top",
          "default": 25,
          "units": "%"
        },
        left: {
          elem: "input",
          type: "number",
          label: "Left",
          "default": 30,
          "units": "%"
        },
        target: "#wikipedia-container"
      }
    },
  });

})( Popcorn );
