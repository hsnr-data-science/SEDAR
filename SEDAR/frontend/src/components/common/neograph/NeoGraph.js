import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Neovis from "neovis.js/dist/neovis.js";

/**
* Default configs for neograph. 
*/
const NeoGraph = (props) => {
  const {
    width,
    height,
    containerId,
    backgroundColor,
    neo4jUri,
    neo4jUser,
    neo4jPassword,
    initialCypher,
  } = props;

  const visRef = useRef();

  useEffect(() => {
    const config = {
        container_id: visRef.current.id,
        server_url: neo4jUri,
        server_user: neo4jUser,
        server_password: neo4jPassword,
        labels: {
            "Attribute": {
              "caption": "name"
            } ,
            "Entity": {
              "caption": "name"
            }
        },
        physics: {
          enabled: true,
          barnesHut: {
            theta: 0.5,
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 95,
            springConstant: 0.04,
            damping: 0.09,
            avoidOverlap: 0
          },
        },
        relationships: {
          "HAS_ATTRIBUTE": {
            caption: false,
          },
          "HAS_ENTITY": {
            caption: false,
          }                       
        },
        initial_cypher: initialCypher,
    };
    const vis = new Neovis(config);
    vis.render();
  }, [neo4jUri, neo4jUser, neo4jPassword]);

  return (
    <div
      id={containerId}
      ref={visRef}
      style={{
        width: `${width}%`,
        height: `${height}px`,
        backgroundColor: `${backgroundColor}`,
      }}
    />
  );
};

NeoGraph.defaultProps = {
  width: '100%',
  height: 400,
  backgroundColor: "rgba(0, 0, 0, 0.0);",
};

NeoGraph.propTypes = {
  width: PropTypes.number.isRequired,
  height: PropTypes.number.isRequired,
  containerId: PropTypes.string.isRequired,
  neo4jUri: PropTypes.string.isRequired,
  neo4jUser: PropTypes.string.isRequired,
  neo4jPassword: PropTypes.string.isRequired,
  backgroundColor: PropTypes.string,
  initialCypher: PropTypes.string, 
};

export { NeoGraph };