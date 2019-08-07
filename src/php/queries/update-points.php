<?php
  class UpdatePoints extends Query{
    public function query($pdo, $args){
      foreach($args as $user){
        $st = $pdo->prepare('
          update User
          set points = ?
          where nick = ?
        ');
        $st->execute([$user[1], $user[0]]);
      }

      $this->succ();
    }
  }

  new UpdatePoints();
?>