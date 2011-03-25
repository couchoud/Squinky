/*!
    
    squinky v 0.1
    
    jQuery.ajax stripped to it's bare bones. It won't make jsonp calls or load in
    scripts, so don't even bother. 
    
    Squinky is lazy and it expects your data to be serialized for
    PUT and POST requests. Go ahead and don't serialize... I dare you.

 */
var squinky = {
    
    settings : {
        type: "GET",
        contentType: "application/x-www-form-urlencoded",
        accepts: {
            xml: "application/xml, text/xml",
            html: "text/html",
            json: "application/json, text/javascript",
            text: "text/plain",
            _default: "*/*"
        }
    },
    
    xhr : function() {
        if ( window.location.protocol !== "file:" ) {
            try {
                return new window.XMLHttpRequest();
            } catch(xhrError) {}
        }

        try {
            return new window.ActiveXObject("Microsoft.XMLHTTP");
        } catch(activeError) {}
    },
    
    /**
        Method: ajax
        
        Parameters:
    */
    ajax : function( options ) {
        
        var xhr = this.xhr();
        
        if( !xhr ) {
            return;
        }
        
        var s = this.settings,
            type = options.type.toUpperCase() || s.type, 
            status = "",
            success = function( data ) {
                options.success && options.success(data);
            },
            error = function( xhr, status ) {
                options.error && options.error(xhr, status);
            };
        
        if(options.data && (type === "GET" || type === "HEAD")) {
            var params ='?';
            for(var k in options.data){
                params+= encodeURIComponent(k) + '=' + encodeURIComponent(options.data[k]) + '&';
            }
            options.url+=params;
        }       
        
        xhr.open(type, options.url);
        
        // set some headers
        try {
            // Set content-type if data specified and content-body is valid for this type
            if ( options.data != null) {
                xhr.setRequestHeader("Content-Type", options.contentType || s.contentType);
            }
            
            // Set the Accepts header for the server, depending on the dataType
            xhr.setRequestHeader("Accept", options.dataType && s.accepts[ options.dataType ] ? s.accepts[ options.dataType ] + ", */*; q=0.01" : s.accepts._default );          
        }
        catch(error){
            error(xhr, status);
        }
        
        var onreadystatechange = xhr.onreadystatechange = function( ) {
            // The request was aborted
            if ( !xhr || xhr.readyState === 0) {
                options.error && options.error();
            // The transfer is complete and the data is available, or the request timed out
            } else if (xhr && (xhr.readyState === 4) ) {
                
                xhr.onreadystatechange = function(){};
                
                status = !squinky.httpSuccess( xhr ) ? "error" : "success";
                
                var errMsg;

                if ( status === "success" ) {
                    // Watch for, and catch, XML document parse errors
                    try {
                        // process the data (runs the xml through httpData regardless of callback)
                        data = squinky.httpData( xhr, options.dataType);
                    } catch( parserError ) {
                        status = "parsererror";
                        errMsg = parserError;
                    }
                }

                // Make sure that the request was successful or notmodified
                if ( status === "success") {
                    success(data);
                }
                else {
                    error(xhr,status);
                }
            }
        };
        
        try {
            xhr.send(options.data || "");
        }
        catch(error) {
            error(xhr,status);
        }
        
    },
    
    httpSuccess: function( xhr ) {
        try {
            return !xhr.status && location.protocol === "file:" ||
                xhr.status >= 200 && xhr.status < 300 ||
                xhr.status === 304 || xhr.status === 1223;
        } catch(e) {}

        return false;
    },
    
    /**
        Method: httpData
        
        Parses the data return from the ajax request. Expects
        the xhr response to be from a safe source. It doesn't do any
        regex validation or anything fancy with the data to protect
        you from evil responses.
    */
    httpData : function( xhr, type) {
        var ct = xhr.getResponseHeader("content-type") || "",
            xml = type === "xml" || !type && ct.indexOf("xml") >= 0,
            data = xml ? xhr.responseXML : xhr.responseText;

        if ( xml && data.documentElement.nodeName === "parsererror" ) {
            throw "parsererror";
        }
        
        // The filter can actually parse the response
        if ( typeof data === "string" ) {
            // Get the JavaScript object, if JSON is used.
            if ( type === "json" || !type && ct.indexOf("json") >= 0 ) {
                data = (new Function("return " + data))();
            }
        }

        return data;
    }
};