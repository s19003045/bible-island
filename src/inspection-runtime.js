// One application owns one inspection renderer. Closing a modal releases its
// scene/listeners, while retaining the expensive context and reflection map.
export function createInspectionRuntime(factory) {
  let resource=null,active=null,generation=0;
  return {
    acquire(cleanup=()=>{}) {
      active?.release();
      if(!resource)resource=factory(++generation);
      let released=false;
      const lease={resource,generation,
        release(){if(released)return;released=true;cleanup();if(active===lease)active=null;},
      };
      active=lease;return lease;
    },
    dispose(){active?.release();resource?.dispose();resource=null;},
  };
}
